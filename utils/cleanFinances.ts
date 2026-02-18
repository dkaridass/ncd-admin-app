import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const clearFinances = async () => {
    console.log('🗑️ Clearing all finance records...');
    try {
        const snapshot = await getDocs(collection(db, 'finances'));
        const deletePromises = snapshot.docs.map(document =>
            deleteDoc(doc(db, 'finances', document.id))
        );

        await Promise.all(deletePromises);
        console.log(`✅ Successfully deleted ${snapshot.size} finance records.`);
        return { success: true, count: snapshot.size };
    } catch (error) {
        console.error('❌ Error clearing finances:', error);
        return { success: false, error };
    }
};
