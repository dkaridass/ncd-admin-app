import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import membersData from '../data/archive/members.json';

export const cleanOldMembers = async () => {
    try {
        console.log('🧹 Starting cleanup of old members...');
        const membersRef = collection(db, 'members');
        const oldMemberNames = membersData.members.map(m => m.name.trim().toUpperCase());

        console.log(`📋 Found ${oldMemberNames.length} names in archive file to check.`);

        const snapshot = await getDocs(membersRef);
        let deletedCount = 0;
        const batchSize = 400; // Firestore batch limit is 500
        let batch = writeBatch(db);
        let operationCount = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const memberName = (data.name || '').trim().toUpperCase();

            if (oldMemberNames.includes(memberName)) {
                // Delete match
                batch.delete(doc(db, 'members', docSnap.id));
                deletedCount++;
                operationCount++;

                if (operationCount >= batchSize) {
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                }
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        console.log(`✅ Cleanup complete. Deleted ${deletedCount} old members.`);
        return deletedCount;
    } catch (error) {
        console.error('❌ Error cleaning old members:', error);
        throw error;
    }
};
