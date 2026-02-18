/**
 * Check Data Integrity
 * Usage: npx tsx utils/checkData.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

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

async function check() {
    console.log('🔍 Checking Data...\n');

    // Check Department 9 (ACCUEIL)
    const deptRef = doc(db, 'departments', 'dept_9');
    const deptSnap = await getDoc(deptRef);

    if (deptSnap.exists()) {
        console.log('✅ Department 9 (ACCUEIL) found:');
        console.log(JSON.stringify(deptSnap.data(), null, 2));
    } else {
        console.error('❌ Department 9 NOT FOUND');
    }

    // Check Member 2 (MYSCHAEL)
    const memberRef = doc(db, 'members', 'member_2');
    const memberSnap = await getDoc(memberRef);

    if (memberSnap.exists()) {
        console.log('\n✅ Member 2 (MYSCHAEL) found:');
        console.log(JSON.stringify(memberSnap.data(), null, 2));
    } else {
        console.error('\n❌ Member 2 NOT FOUND');
    }

    process.exit();
}

check();
