import { collection, addDoc, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const updateProgramme = async () => {
    console.log('🔄 Starting Church Programme Update...');
    console.log('📊 Firebase DB instance:', db);

    try {
        const batch = writeBatch(db);
        const eventsRef = collection(db, 'events');
        console.log('📁 Events collection reference created');

        // 1. Clean up existing future 'Culte' events to avoid duplicates
        // Note: In a real prod app, be careful not to delete special events.
        // Here we assume standard recurring services can be reset.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('📅 Today:', today.toISOString());

        const q = query(eventsRef, where('type', '==', 'Culte'));
        console.log('🔍 Querying for existing Culte events...');

        const snapshot = await getDocs(q);
        console.log(`🧹 Found ${snapshot.size} existing Culte events`);

        snapshot.docs.forEach(d => {
            const data = d.data();
            const date = new Date(data.date);
            if (date >= today) {
                console.log(`🗑️ Deleting future event: ${d.id} (${data.title} on ${data.date})`);
                batch.delete(doc(db, 'events', d.id));
            }
        });

        // 2. Generate new schedule for 6 months
        const targetDate = new Date(today);
        targetDate.setMonth(targetDate.getMonth() + 6);

        let current = new Date(today);
        let count = 0;
        console.log('📅 Generating services from', today.toISOString(), 'to', targetDate.toISOString());

        while (current <= targetDate) {
            const day = current.getDay();
            // Use local date formatting to avoid timezone issues
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const date = String(current.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${date}`;

            console.log(`📆 Processing ${dateStr} (day ${day})`);

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
                console.log(`✅ Created ${day === 3 ? 'Mercredi' : 'Vendredi'} service for ${dateStr}`);
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
                console.log(`✅ Created 3 Sunday services for ${dateStr}`);
            }

            // Next day
            current.setDate(current.getDate() + 1);
        }

        await batch.commit();
        console.log(`✅ Programme updated! Created ${count} services.`);
        console.log('🎉 Batch commit successful!');
        return true;

    } catch (error) {
        console.error("❌ Error updating programme:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        return false;
    }
};
