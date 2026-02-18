import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import departmentsData from '../data/departments.json';
import membersData from '../data/members.json';

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
    'LOUANGE JVI': 'LOUANGE',
    'LOUANGE': 'LOUANGE',
    'ACCUEIL': 'ACCUEIL'
};

export const runFrontendImport = async (db: any) => {
    console.log('🚀 Starting Frontend Data Import...');

    // Map department names to Firestore Document IDs
    const departmentIdMap: Map<string, string> = new Map();
    const batch = writeBatch(db);

    // Step 1: Departments
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
    }

    // Step 2: Members
    const departmentMembers: Map<string, string[]> = new Map();
    const departmentLeaders: Map<string, { leaderId?: string; vpId?: string; secondVpId?: string }> = new Map();

    for (const member of membersData.members) {
        const memberId = `member_${member.number}`;
        const memberRef = doc(db, 'members', memberId);

        const departmentIds: string[] = [];
        const responsibilities: string[] = member.responsibilities || [];

        // Improved Matching Logic
        for (const resp of responsibilities) {
            let searchTerm = resp.toUpperCase().trim();

            // Check aliases
            for (const [alias, actual] of Object.entries(departmentAliases)) {
                if (searchTerm.includes(alias)) {
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
                    const isPasteur = member.leadershipLevel === 'Pasteur' || resp.toUpperCase().includes('PASTEUR') || member.role === 'Pasteur' || member.role === 'Pasteure';
                    const isBerger = member.role === 'Berger' || member.role === 'Bergère';

                    if (isPasteur || isBerger) {
                        leaders.leaderId = memberId;
                    } else if (is2VP) {
                        leaders.secondVpId = memberId;
                    } else if (isVP) {
                        if (!leaders.vpId) leaders.vpId = memberId;
                        else if (!leaders.secondVpId && leaders.vpId !== memberId) leaders.secondVpId = memberId;
                    } else {
                        if (!leaders.leaderId && !resp.toUpperCase().includes('VP')) {
                            // Only assign as leader if no explicit Berger/Pasteur found yet? 
                            // Actually, let's keep it safe: strict role check or explicit responsibility
                            leaders.leaderId = memberId;
                        }
                    }
                }
            }
        }

        const memberData = {
            name: member.name,
            role: member.role,
            status: 'Fidèle',
            gender: (member.role === 'Sœur' || member.role === 'Bergère' || member.role === 'Pasteure') ? 'Femme' : 'Homme',
            birthDate: '1990-01-01',
            phone: '',
            email: '',
            joinDate: new Date().toISOString().split('T')[0],
            family: 'NCD',
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`,
            departmentIds,
            primaryDepartmentId: departmentIds[0] || null,
            responsibilities,
            isLeader: member.isLeader || false,
            leadershipLevel: member.leadershipLevel || null
        };

        if (member.leadershipLevel) memberData.isLeader = true;

        batch.set(memberRef, memberData);
    }

    // Execute Batch 1 (Depts + Members) - Firestore batches limited to 500 ops
    // We have 29 depts + ~60 members = ~90 ops. Safe.
    await batch.commit();

    // Step 3: Update Links (New Batch)
    const linkBatch = writeBatch(db);

    for (const [deptId, memberIds] of departmentMembers.entries()) {
        const deptRef = doc(db, 'departments', deptId);
        const leaders = departmentLeaders.get(deptId) || {};

        linkBatch.update(deptRef, {
            memberCount: memberIds.length,
            memberIds,
            leaderId: leaders.leaderId || null,
            vpId: leaders.vpId || null,
            secondVpId: leaders.secondVpId || null
        });
    }

    await linkBatch.commit();
    console.log('✅ Frontend Import Complete');
    return true;
};
