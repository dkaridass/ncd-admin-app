/**
 * Import Departments and Members into Firestore
 * 
 * This script reads JSON files and populates Firestore with:
 * - 29 Departments
 * - Members with roles and responsibilities
 * - Links between departments and members
 * - Leader assignments
 * 
 * Usage: npm run import-data
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import departmentsData from '../data/departments.json';
import membersData from '../data/members.json';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey) {
    console.error('❌ Error: Firebase config missing.');
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Map department names to Firestore Document IDs
const departmentIdMap: Map<string, string> = new Map();

// Alias Map for better matching
const departmentAliases: Record<string, string> = {
    'ECODIM': 'ECOLE DE DIMANCHE',
    'AIV': 'INTERCESSION',
    'PROTOCOLE': 'PROTOCOLES',
    'FAMILLES': 'FAMILLE',
    'FAMILLES, FIANCAILLES MARIAGE': 'FAMILLE',
    'FIANCAILLES': 'FIANCAILLES',
    'PREDICATEURS': 'CORPS DES PREDICATEURS',
    'CORPS DE PREDICATEURS': 'CORPS DES PREDICATEURS',
    'TECH': 'TECHNIQUE',
    'LOUANGE JVI': 'LOUANGE', // Ou JVI ?
    'LOUANGE': 'LOUANGE'
};

async function authenticate() {
    try {
        await signInAnonymously(auth);
        console.log('🔑 Authenticated anonymously');
    } catch (e) {
        console.warn('⚠️  Auth failed (might work if rules are open):', e);
    }
}

async function importDepartments() {
    console.log('\n🏢 Step 1: Importing Departments...\n');
    const batch = writeBatch(db);
    let count = 0;

    for (const dept of departmentsData.departments) {
        const deptId = `dept_${dept.number}`;
        const deptRef = doc(db, 'departments', deptId);

        const deptData = {
            number: dept.number,
            name: dept.name,
            category: dept.category,
            meetingDay: dept.meetingDay || '',
            meetingTime: dept.meetingTime || '',
            memberCount: 0,
            memberIds: [],
            reportStatus: 'À jour'
        };

        batch.set(deptRef, deptData);
        departmentIdMap.set(dept.name, deptId);
        count++;
        console.log(`  ✅ ${dept.number}. ${dept.name} → ${deptId}`);
    }

    await batch.commit();
    console.log(`\n✨ Imported ${count} departments\n`);
}

async function importMembers() {
    console.log('\n👥 Step 2: Importing Members & Linking...\n');

    const batch = writeBatch(db);
    const departmentMembers: Map<string, string[]> = new Map();
    const departmentLeaders: Map<string, { leaderId?: string; vpId?: string; secondVpId?: string }> = new Map();

    let count = 0;

    for (const member of membersData.members) {
        const memberId = `member_${member.number}`;
        const memberRef = doc(db, 'members', memberId);

        const departmentIds: string[] = [];
        const responsibilities: string[] = member.responsibilities || [];

        // Improved Matching Logic
        for (const resp of responsibilities) {
            let searchTerm = resp.toUpperCase().trim();

            // Check aliases first (exact match on alias key)
            // Iterate keys to see if resp CONTAINS alias key
            for (const [alias, actual] of Object.entries(departmentAliases)) {
                if (searchTerm.includes(alias)) {
                    // Replace the alias part with the actual name, or just use actual name for search
                    // Simplest is to just search using the actual name if alias is found
                    searchTerm = actual;
                    break;
                }
            }

            // Find dept
            const exactMatch = Array.from(departmentIdMap.keys()).find(deptName =>
                searchTerm.includes(deptName.toUpperCase()) ||
                deptName.toUpperCase().includes(searchTerm)
            );

            if (exactMatch) {
                const deptId = departmentIdMap.get(exactMatch)!;
                if (!departmentIds.includes(deptId)) {
                    departmentIds.push(deptId);

                    if (!departmentMembers.has(deptId)) departmentMembers.set(deptId, []);
                    departmentMembers.get(deptId)!.push(memberId);
                }

                // Leader Logic
                if (member.isLeader || member.leadershipLevel) {
                    if (!departmentLeaders.has(deptId)) departmentLeaders.set(deptId, {});
                    const leaders = departmentLeaders.get(deptId)!;

                    const isVP = member.leadershipLevel === 'VP' || resp.toUpperCase().includes('VP');
                    const is2VP = resp.toUpperCase().includes('2ÈME') || resp.toUpperCase().includes('2EME');
                    const isPasteur = member.leadershipLevel === 'Pasteur' || resp.toUpperCase().includes('PASTEUR');

                    if (isPasteur) {
                        leaders.leaderId = memberId; // Priorité absolue
                    } else if (is2VP) {
                        leaders.secondVpId = memberId;
                    } else if (isVP) {
                        if (!leaders.vpId) leaders.vpId = memberId;
                        else if (!leaders.secondVpId && leaders.vpId !== memberId) leaders.secondVpId = memberId;
                    } else {
                        // Si Berger sans précision VP/Pasteur, on le met Titulaire si vide
                        if (!leaders.leaderId && !resp.toUpperCase().includes('VP')) {
                            leaders.leaderId = memberId;
                        }
                    }
                }
            }
        }

        // Prepare Member Data
        const memberData = {
            name: member.name,
            role: member.role,
            status: 'Fidèle' as const,
            gender: (member.role === 'Sœur' || member.role === 'Bergère' || member.role === 'Pasteure') ? 'Femme' as const : 'Homme' as const,
            birthDate: '1990-01-01',
            phone: '',
            email: '',
            joinDate: new Date().toISOString().split('T')[0],
            family: 'NCD',
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`,
            departmentIds,
            primaryDepartmentId: departmentIds[0] || undefined,
            responsibilities,
            isLeader: member.isLeader || false, // Should be true if any resp matches leadership
            leadershipLevel: member.leadershipLevel || undefined
        };

        if (member.leadershipLevel) memberData.isLeader = true;

        batch.set(memberRef, memberData);
        count++;

        console.log(`  ✅ ${member.number}. ${member.name} -> [${departmentIds.map(d => d.split('_')[1]).join(', ')}]`);
    }

    await batch.commit();
    console.log(`\n✨ Imported ${count} members\n`);

    return { departmentMembers, departmentLeaders };
}

async function updateDepartments(
    departmentMembers: Map<string, string[]>,
    departmentLeaders: Map<string, { leaderId?: string; vpId?: string; secondVpId?: string }>
) {
    console.log('\n🔗 Step 3: Linking Departments...\n');
    const batch = writeBatch(db);
    let count = 0;

    for (const [deptId, memberIds] of departmentMembers.entries()) {
        const deptRef = doc(db, 'departments', deptId);
        const leaders = departmentLeaders.get(deptId) || {};

        batch.update(deptRef, {
            memberCount: memberIds.length,
            memberIds,
            leaderId: leaders.leaderId || null,
            vpId: leaders.vpId || null,
            secondVpId: leaders.secondVpId || null
        });

        count++;
    }
    await batch.commit();
    console.log(`\n✨ Updated ${count} departments\n`);
}

async function main() {
    console.log('\n🚀 Starting Robust Data Import...\n');
    try {
        await authenticate();
        await importDepartments();
        const { departmentMembers, departmentLeaders } = await importMembers();
        await updateDepartments(departmentMembers, departmentLeaders);
        console.log('\n✅ Import Complete!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

main();
