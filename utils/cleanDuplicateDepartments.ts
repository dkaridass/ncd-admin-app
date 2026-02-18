import { db } from '../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * Removes duplicate departments from Firestore
 * Keeps only the most recent version of each department based on name
 */
export const removeDuplicateDepartments = async () => {
    console.log('🧹 Starting duplicate department cleanup...');

    try {
        const deptCollection = collection(db, 'departments');
        const snapshot = await getDocs(deptCollection);

        // Group departments by name
        const deptsByName = new Map<string, any[]>();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const name = (data.name || '').trim().toUpperCase();

            if (!name) return;

            if (!deptsByName.has(name)) {
                deptsByName.set(name, []);
            }

            deptsByName.get(name)!.push({
                id: doc.id,
                ...data
            });
        });

        // Find duplicates
        const duplicates: string[] = [];
        const toDelete: string[] = [];

        deptsByName.forEach((depts, name) => {
            if (depts.length > 1) {
                duplicates.push(name);
                console.log(`📋 Found ${depts.length} copies of "${name}"`);

                // Sort by updatedAt or createdAt, keep the newest
                depts.sort((a, b) => {
                    const dateA = a.updatedAt || a.createdAt || '';
                    const dateB = b.updatedAt || b.createdAt || '';
                    return dateB.localeCompare(dateA);
                });

                // Mark all except the first (newest) for deletion
                for (let i = 1; i < depts.length; i++) {
                    toDelete.push(depts[i].id);
                    console.log(`  ❌ Will delete: ${depts[i].id}`);
                }
                console.log(`  ✅ Will keep: ${depts[0].id}`);
            }
        });

        if (toDelete.length === 0) {
            console.log('✨ No duplicates found!');
            return { success: true, deleted: 0, duplicates: [] };
        }

        console.log(`\n🗑️  Deleting ${toDelete.length} duplicate departments...`);

        // Delete in batches (Firestore limit is 500 per batch)
        const batchSize = 500;
        for (let i = 0; i < toDelete.length; i += batchSize) {
            const batch = writeBatch(db);
            const batchIds = toDelete.slice(i, i + batchSize);

            batchIds.forEach(id => {
                const docRef = doc(db, 'departments', id);
                batch.delete(docRef);
            });

            await batch.commit();
            console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1}`);
        }

        console.log(`\n🎉 Cleanup complete! Deleted ${toDelete.length} duplicates.`);
        console.log(`📊 Affected departments: ${duplicates.join(', ')}`);

        return {
            success: true,
            deleted: toDelete.length,
            duplicates: duplicates
        };

    } catch (error) {
        console.error('❌ Error cleaning duplicates:', error);
        return {
            success: false,
            error: error
        };
    }
};
