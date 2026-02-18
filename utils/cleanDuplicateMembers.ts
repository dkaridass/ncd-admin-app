import { db } from '../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * Removes duplicate members from Firestore
 * Keeps the "best" version of each member based on completeness and role
 */
export const removeDuplicateMembers = async () => {
    console.log('🧹 Starting duplicate member cleanup...');

    try {
        const membersCollection = collection(db, 'members');
        const snapshot = await getDocs(membersCollection);

        // Group members by normalized name
        const membersByName = new Map<string, any[]>();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const name = (data.name || '').trim().toUpperCase();

            if (!name) return; // Skip empty names

            if (!membersByName.has(name)) {
                membersByName.set(name, []);
            }

            membersByName.get(name)!.push({
                id: doc.id,
                ...data
            });
        });

        // Find duplicates
        const duplicates: string[] = [];
        const toDelete: string[] = [];

        membersByName.forEach((members, name) => {
            if (members.length > 1) {
                duplicates.push(name);
                console.log(`📋 Found ${members.length} copies of "${name}"`);

                // Calculate Quality Score for sorting
                // Higher score = Better record to keep
                const getScore = (m: any) => {
                    let score = 0;
                    if (m.isLeader === true) score += 10;
                    if (m.role && m.role !== 'Fidèle' && m.role !== 'Visiteur') score += 5;
                    if (m.departmentIds && m.departmentIds.length > 0) score += 5;
                    if (m.responsibilities && m.responsibilities.length > 0) score += 3;
                    if (m.phone && m.phone.length > 5) score += 2;
                    if (m.email && m.email.length > 5) score += 2;
                    return score;
                };

                // Sort: Highest Score first, then Newest (if scores equal)
                members.sort((a, b) => {
                    const scoreA = getScore(a);
                    const scoreB = getScore(b);

                    if (scoreA !== scoreB) {
                        return scoreB - scoreA; // Descending score
                    }

                    // Tie-breaker: creation date (if we had it) or just ID string comparison fallback
                    // Assuming imported data might not have createdAt timestamps consistently
                    // We'll prefer longer ID (usually Firestore auto-id) over short numeric ID (imported)
                    // actually, let's just pick one.
                    return b.id.localeCompare(a.id);
                });

                // Mark all except the first (best) for deletion
                for (let i = 1; i < members.length; i++) {
                    toDelete.push(members[i].id);
                    console.log(`  ❌ Will delete: ${members[i].name} (ID: ${members[i].id}) - Score: ${getScore(members[i])}`);
                }
                console.log(`  ✅ Will keep: ${members[0].name} (ID: ${members[0].id}) - Score: ${getScore(members[0])}`);
            }
        });

        if (toDelete.length === 0) {
            console.log('✨ No duplicates found!');
            return { success: true, deleted: 0, duplicates: [] };
        }

        console.log(`\n🗑️  Deleting ${toDelete.length} duplicate members...`);

        // Delete in batches (Firestore limit is 500 per batch)
        const batchSize = 500;
        for (let i = 0; i < toDelete.length; i += batchSize) {
            const batch = writeBatch(db);
            const batchIds = toDelete.slice(i, i + batchSize);

            batchIds.forEach(id => {
                const docRef = doc(db, 'members', id);
                batch.delete(docRef);
            });

            await batch.commit();
            console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1}`);
        }

        console.log(`\n🎉 Cleanup complete! Deleted ${toDelete.length} duplicates.`);
        console.log(`📊 Affected members: ${duplicates.join(', ')}`);

        return {
            success: true,
            deleted: toDelete.length,
            duplicates: duplicates
        };

    } catch (error: any) {
        console.error('❌ Error cleaning duplicates:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
