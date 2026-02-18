import { collection, addDoc, setDoc, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

// Sample data generator
export const seedDatabase = async () => {
    console.log('🌱 Starting database seeding...');

    try {
        // 1. Create Departments
        const departments = [
            { id: 'choir', name: 'Chorale', leaderId: 'user1', memberCount: 0 },
            { id: 'youth', name: 'Jeunesse', leaderId: 'user1', memberCount: 0 },
            { id: 'intercessors', name: 'Intercesseurs', leaderId: 'user1', memberCount: 0 },
            { id: 'protocol', name: 'Protocole', leaderId: 'user1', memberCount: 0 },
        ];

        for (const dept of departments) {
            await setDoc(doc(db, 'departments', dept.id), dept);
        }
        console.log('✅ Departments created');

        // 2. Create Sample Members
        const sampleMembers = [
            { name: 'Jean Mukendi', email: 'jean@ncd.cd', phone: '+243 812 345 678', family: 'choir', role: 'Frère' as const, gender: 'Homme' as const, churchFunction: 'Serviteur' as const },
            { name: 'Marie Kabongo', email: 'marie@ncd.cd', phone: '+243 812 345 679', family: 'youth', role: 'Sœur' as const, gender: 'Femme' as const, churchFunction: 'Serviteur' as const },
            { name: 'Pierre Tshombe', email: 'pierre@ncd.cd', phone: '+243 812 345 680', family: 'intercessors', role: 'Berger' as const, gender: 'Homme' as const, churchFunction: 'Berger' as const },
            { name: 'Grace Mbuyi', email: 'grace@ncd.cd', phone: '+243 812 345 681', family: 'protocol', role: 'Bergère' as const, gender: 'Femme' as const, churchFunction: 'Pasteur' as const },
            { name: 'David Kasongo', email: 'david@ncd.cd', phone: '+243 812 345 682', family: 'choir', role: 'Frère' as const, gender: 'Homme' as const, churchFunction: 'Président de département' as const },
            { name: 'Sarah Ndala', email: 'sarah@ncd.cd', phone: '+243 812 345 683', family: 'youth', role: 'Sœur' as const, gender: 'Femme' as const, churchFunction: 'Serviteur' as const },
            { name: 'Joseph Kalala', email: 'joseph@ncd.cd', phone: '+243 812 345 684', family: 'intercessors', role: 'Frère' as const, gender: 'Homme' as const, churchFunction: 'Administrateur' as const },
            { name: 'Rebecca Ilunga', email: 'rebecca@ncd.cd', phone: '+243 812 345 685', family: 'protocol', role: 'Sœur' as const, gender: 'Femme' as const, churchFunction: 'Serviteur' as const },
            { name: 'Emmanuel Mutombo', email: 'emmanuel@ncd.cd', phone: '+243 812 345 686', family: 'choir', role: 'Frère' as const, gender: 'Homme' as const, churchFunction: 'Serviteur' as const },
            { name: 'Ruth Kambale', email: 'ruth@ncd.cd', phone: '+243 812 345 687', family: 'youth', role: 'Sœur' as const, gender: 'Femme' as const, churchFunction: 'Vice président de département' as const },
        ];

        for (let i = 0; i < sampleMembers.length; i++) {
            const member = sampleMembers[i];
            await addDoc(collection(db, 'members'), {
                ...member,
                status: 'Fidèle',
                birthDate: `198${i % 10}-0${(i % 9) + 1}-15`,
                joinDate: `2024-0${(i % 9) + 1}-01`,
                whatsapp: member.phone,
                address: 'Kinshasa, RDC',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2563eb&color=fff`,
            });
        }
        console.log('✅ Sample members created');

        // 3. Create Finance Records (varied dates for chart testing)
        const financeTypes = ['Dîme', 'Offrande', 'Action de grâce', 'Dons', 'Dépense'];
        const currencies = ['USD', 'CDF'];
        const accounts = ['Rawbank', 'Equity', 'PayPal', 'Mpesa', 'OrangeMoney', 'Cash'];
        const months = ['2026-01', '2025-12', '2025-11'];

        for (const month of months) {
            // Create 15 records per month
            for (let i = 0; i < 15; i++) {
                const type = financeTypes[Math.floor(Math.random() * (financeTypes.length - 1))]; // Exclude expense for most
                const currency = currencies[Math.floor(Math.random() * currencies.length)];
                const account = accounts[Math.floor(Math.random() * accounts.length)];
                const isExpense = i % 10 === 0; // Every 10th record is an expense

                const financeRecord: any = {
                    type: isExpense ? 'Dépense' : type,
                    amount: isExpense
                        ? (currency === 'USD' ? Math.floor(Math.random() * 500) + 100 : Math.floor(Math.random() * 500000) + 50000)
                        : (currency === 'USD' ? Math.floor(Math.random() * 100) + 10 : Math.floor(Math.random() * 100000) + 5000),
                    currency,
                    account, // ADDED ACCOUNT
                    date: `${month}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                    recordedBy: 'Admin',
                    isApproved: true,
                };

                // Only add memberName and serviceName for income records (not expenses)
                if (!isExpense) {
                    financeRecord.memberName = sampleMembers[Math.floor(Math.random() * sampleMembers.length)].name;
                    financeRecord.serviceName = ['1er Culte (Dim)', '2ème Culte (Dim)', 'Culte Mercredi'][Math.floor(Math.random() * 3)];
                } else {
                    financeRecord.notes = `Achat de matériel ${i}`;
                }

                await addDoc(collection(db, 'finances'), financeRecord);
            }
        }
        console.log('✅ Finance records created');

        // 4. Create Events
        const events = [
            {
                title: 'Culte Dominical',
                description: 'Culte hebdomadaire du dimanche',
                date: '2026-01-25',
                time: '10:00',
                location: 'Église NCD La Pentecôte',
                type: 'Culte',
                rsvps: [],
            },
            {
                title: 'Rencontre de Jeunesse',
                description: 'Activités et enseignement pour les jeunes',
                date: '2026-01-26',
                time: '15:00',
                location: 'Salle de jeunesse',
                type: 'Jeunesse',
                rsvps: [],
            },
            {
                title: 'Réunion de Prière',
                description: 'Temps de prière et intercession',
                date: '2026-01-27',
                time: '18:00',
                location: 'Église',
                type: 'Prière',
                rsvps: [],
            },
        ];

        for (const event of events) {
            await addDoc(collection(db, 'events'), event);
        }
        console.log('✅ Events created');

        // 5. Create Announcements
        const announcements = [
            {
                title: 'Bienvenue à NCD La Pentecôte',
                content: 'Nous sommes heureux de vous accueillir dans notre église. Que Dieu vous bénisse!',
                author: 'Pasteur Principal',
                date: new Date().toISOString().split('T')[0],
            },
            {
                title: 'Culte Spécial ce Dimanche',
                content: 'Un culte spécial aura lieu ce dimanche avec un invité spécial. Tous sont invités!',
                author: 'Équipe Protocole',
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            },
        ];

        for (const announcement of announcements) {
            await addDoc(collection(db, 'announcements'), announcement);
        }
        console.log('✅ Announcements created');

        // 6. Create Daily Rhema
        const rhemas = [
            {
                // Yesterday - so today is missing and triggers AI
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                content: "L'Éternel est mon berger: je ne manquerai de rien.",
                reference: "Psaumes 23:1",
                theme: "Provision",
                author: "Pasteur Principal"
            }
        ];

        for (const rhema of rhemas) {
            // Check if exists to avoid duplicates
            const q = query(collection(db, 'rhema'), where('date', '==', rhema.date));
            const snap = await getDocs(q);
            if (snap.empty) {
                await addDoc(collection(db, 'rhema'), rhema);
            }
        }
        console.log('✅ Rhema created');

        console.log('🎉 Database seeding complete!');
        console.log('📊 Summary:');
        console.log('  - 4 departments');
        console.log('  - 10 members');
        console.log('  - ~45 finance records');
        console.log('  - 3 events');
        console.log('  - 2 announcements');
        console.log('  - 2 rhema entries');

        return { success: true };
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        return { success: false, error };
    }
};
