#!/usr/bin/env tsx

/**
 * Script to populate the church programme (recurring services) into Firestore
 * 
 * This script generates recurring church services for the next 6 months:
 * - Mercredi & Vendredi: 16h30-18h30
 * - Dimanche: 3 services (07h20-09h20, 09h30-11h30, 16h00-18h00)
 * 
 * Usage: npm run update-programme
 */

// Load environment variables for Node.js execution
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Now import Firebase modules after env is loaded
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';

// Initialize Firebase with environment variables
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateProgramme() {
    console.log('🔄 Starting Church Programme Update...');

    try {
        const batch = writeBatch(db);
        const eventsRef = collection(db, 'events');

        // 1. Clean up existing future 'Culte' events to avoid duplicates
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(eventsRef, where('type', '==', 'Culte'));
        const snapshot = await getDocs(q);

        console.log(`🧹 Cleaning up ${snapshot.size} existing Culte events...`);
        snapshot.docs.forEach(d => {
            const data = d.data();
            const date = new Date(data.date);
            if (date >= today) {
                batch.delete(doc(db, 'events', d.id));
            }
        });

        // 2. Generate new schedule for 6 months
        const targetDate = new Date(today);
        targetDate.setMonth(targetDate.getMonth() + 6);

        let current = new Date(today);
        let count = 0;

        while (current <= targetDate) {
            const day = current.getDay();
            const dateStr = current.toISOString().split('T')[0];

            // Wednesday (3) & Friday (5)
            // 16h30 – 18h30
            if (day === 3 || day === 5) {
                const newDocRef = doc(collection(db, 'events'));
                batch.set(newDocRef, {
                    title: day === 3 ? 'Culte Mercredi' : 'Culte Vendredi',
                    description: 'Enseignement et prière',
                    date: dateStr,
                    start: new Date(`${dateStr}T16:30:00`),
                    end: new Date(`${dateStr}T18:30:00`),
                    location: 'Église NCD La Pentecôte',
                    type: 'Culte',
                    rsvps: []
                });
                count++;
            }

            // Sunday (0)
            // 1er culte: 07h20 – 09h20
            // 2ème culte: 09h30 – 11h30
            // 3ème culte: 16h00 – 18h00
            if (day === 0) {
                // 1er Culte
                const ref1 = doc(collection(db, 'events'));
                batch.set(ref1, {
                    title: '1er Culte Dominical',
                    description: 'Culte de louange et adoration',
                    date: dateStr,
                    start: new Date(`${dateStr}T07:20:00`),
                    end: new Date(`${dateStr}T09:20:00`),
                    location: 'Église NCD La Pentecôte',
                    type: 'Culte',
                    rsvps: []
                });

                // 2ème Culte
                const ref2 = doc(collection(db, 'events'));
                batch.set(ref2, {
                    title: '2ème Culte Dominical',
                    description: 'Culte de louange et adoration',
                    date: dateStr,
                    start: new Date(`${dateStr}T09:30:00`),
                    end: new Date(`${dateStr}T11:30:00`),
                    location: 'Église NCD La Pentecôte',
                    type: 'Culte',
                    rsvps: []
                });

                // 3ème Culte
                const ref3 = doc(collection(db, 'events'));
                batch.set(ref3, {
                    title: '3ème Culte Dominical',
                    description: 'Culte de louange et adoration',
                    date: dateStr,
                    start: new Date(`${dateStr}T16:00:00`),
                    end: new Date(`${dateStr}T18:00:00`),
                    location: 'Église NCD La Pentecôte',
                    type: 'Culte',
                    rsvps: []
                });
                count += 3;
            }

            // Next day
            current.setDate(current.getDate() + 1);
        }

        await batch.commit();
        console.log(`✅ Programme updated! Created ${count} services.`);
        return true;

    } catch (error) {
        console.error("❌ Error updating programme:", error);
        return false;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🏛️  NCD LA PENTECÔTE - Programme Update Script');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        const success = await updateProgramme();

        if (success) {
            console.log('\n✅ SUCCESS! Church programme has been updated.');
            console.log('\n📋 Next Steps:');
            console.log('   1. Open the app and navigate to Events/Programme');
            console.log('   2. Check the Dashboard "Prochain Culte" card');
            console.log('   3. Verify services appear with correct times\n');
            process.exit(0);
        } else {
            console.error('\n❌ FAILED! Programme update encountered errors.');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 CRITICAL ERROR:', error);
        process.exit(1);
    }
}

main();
