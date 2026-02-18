import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Real NCD La Pentecôte Data
export const loadRealChurchData = async () => {
    console.log('🗑️ Clearing test data...');

    try {
        // 1. Clear existing members
        const membersSnapshot = await getDocs(collection(db, 'members'));
        for (const memberDoc of membersSnapshot.docs) {
            await deleteDoc(doc(db, 'members', memberDoc.id));
        }
        console.log(`✅ Cleared ${membersSnapshot.size} test members`);

        // 2. Clear existing departments
        const deptsSnapshot = await getDocs(collection(db, 'departments'));
        for (const deptDoc of deptsSnapshot.docs) {
            await deleteDoc(doc(db, 'departments', deptDoc.id));
        }
        console.log(`✅ Cleared ${deptsSnapshot.size} test departments`);

        // 3. Add Real Departments
        const realDepartments = [
            { id: 'corps-predicateurs', name: 'Corps des Prédicateurs', leaderId: '', memberCount: 0 },
            { id: 'technique', name: 'Technique', leaderId: '', memberCount: 0 },
            { id: 'interpretariat', name: 'Interprétariat', leaderId: '', memberCount: 0 },
            { id: 'finances', name: 'Finances', leaderId: '', memberCount: 0 },
            { id: 'evangelisation', name: 'Évangélisation', leaderId: '', memberCount: 0 },
            { id: 'devotion-matinale', name: 'Dévotion Matinale', leaderId: '', memberCount: 0 },
            { id: 'protocoles', name: 'Protocoles', leaderId: '', memberCount: 0 },
            { id: 'jvi', name: 'JVI', leaderId: '', memberCount: 0 },
            { id: 'accueil', name: 'Accueil', leaderId: '', memberCount: 0 },
            { id: 'presse', name: 'Presse', leaderId: '', memberCount: 0 },
            { id: 'intercession', name: 'Intercession', leaderId: '', memberCount: 0 },
            { id: 'louange', name: 'Louange', leaderId: '', memberCount: 0 },
            { id: 'soeurs', name: 'Sœurs', leaderId: '', memberCount: 0 },
            { id: 'hommes-adultes', name: 'Hommes Adultes', leaderId: '', memberCount: 0 },
            { id: 'decoration', name: 'Décoration', leaderId: '', memberCount: 0 },
            { id: 'social', name: 'Social', leaderId: '', memberCount: 0 },
            { id: 'ecole-dimanche', name: 'École de Dimanche', leaderId: '', memberCount: 0 },
            { id: 'bapteme-sainte-cene', name: 'Baptême et Sainte-Cène', leaderId: '', memberCount: 0 },
            { id: 'securite', name: 'Sécurité', leaderId: '', memberCount: 0 },
            { id: 'transport', name: 'Transport', leaderId: '', memberCount: 0 },
            { id: 'sante', name: 'Santé', leaderId: '', memberCount: 0 },
            { id: 'fiancailles', name: 'Fiançailles', leaderId: '', memberCount: 0 },
            { id: 'partenariat', name: 'Partenariat', leaderId: '', memberCount: 0 },
            { id: 'hygiene-decoration', name: 'Hygiène et Décoration', leaderId: '', memberCount: 0 },
            { id: 'formation-capacites', name: 'Formation et Renforcement de Capacités', leaderId: '', memberCount: 0 },
            { id: 'evenementiel', name: 'Événementiel', leaderId: '', memberCount: 0 },
            { id: 'cellules-maisons', name: 'Cellules de Maisons et Extensions', leaderId: '', memberCount: 0 },
            { id: 'cenacle-bible', name: 'Cénacle pour la Lecture de la Bible', leaderId: '', memberCount: 0 },
            { id: 'construction', name: 'Construction', leaderId: '', memberCount: 0 },
        ];

        for (const dept of realDepartments) {
            await setDoc(doc(db, 'departments', dept.id), dept);
        }
        console.log(`✅ Added ${realDepartments.length} real departments`);

        // 4. Add Real Members (from spreadsheet)
        const realMembers = [
            { name: 'DORA NANGA', role: 'Sœur', family: 'finances', responsibility: 'ECODIM' },
            { name: 'MYSCHAEL NTUMBA', role: 'Berger', family: 'accueil', responsibility: 'VP ECODIM ACCUEIL, LOGEMENT, VOYAGE' },
            { name: 'PAPY KONGOLO', role: 'Berger', family: 'construction', responsibility: '' },
            { name: 'ARMEL TSHIAMALA', role: 'Sœur', family: 'jvi', responsibility: 'VP ALV' },
            { name: 'BENITA MUJKEWU', role: 'Sœur', family: 'decoration', responsibility: 'DECORATION' },
            { name: 'THALLYCIA KAYEMBE', role: 'Sœur', family: 'decoration', responsibility: 'VP DECORATION 2ème VP DECORATION' },
            { name: 'MARTHA KAPINGA', role: 'Sœur', family: 'decoration', responsibility: '' },
            { name: 'JEAN-DIDIER BIAKALA', role: 'Berger', family: 'interpretariat', responsibility: 'INTERPRETARIAT' },
            { name: 'GUY GWAMONZI', role: 'Frère', family: 'interpretariat', responsibility: 'VP INTERPRETARIAT' },
            { name: 'LUC MULAMBA', role: 'Berger', family: 'louange', responsibility: 'GROUPE DE LOUANGE' },
            { name: 'MARC ASSANI', role: 'Frère', family: 'louange', responsibility: 'LOUANGE JVI' },
            { name: 'ISRAEL SENDWE', role: 'Berger', family: 'presse', responsibility: 'PRESSE' },
            { name: 'YANN BILOLO', role: 'Berger', family: 'protocoles', responsibility: 'PROTOCOLE' },
            { name: 'SCHEILA', role: 'Sœur', family: 'protocoles', responsibility: 'VP PROTOCOLE' },
            { name: 'HUGUETTE BILONDA', role: 'Sœur', family: 'protocoles', responsibility: '2ème VP PROTOCOLE' },
            { name: 'AUGUSTIN MALELA', role: 'Berger', family: 'securite', responsibility: 'SÉCURITÉ' },
            { name: 'RAPHAEL KAPIAMBA', role: 'Berger', family: 'transport', responsibility: 'VP SÉCURITÉ' },
            { name: 'CHRISTIAN KITETE', role: 'Pasteur', family: 'corps-predicateurs', responsibility: 'ADMINISTRATION VP ADMINISTRATION' },
            { name: 'BOANERGES TSHEWE', role: 'Frère', family: 'evangelisation', responsibility: '' },
            { name: 'DIMABI MUKUNA', role: 'Berger', family: 'evangelisation', responsibility: 'EVANGELISATION VP EVANGELISATION' },
            { name: 'MICHEL NGOTIZO', role: 'Frère', family: 'technique', responsibility: '' },
            { name: 'LOUISE MWADI', role: 'Bergère', family: 'soeurs', responsibility: 'SŒURS' },
            { name: 'GRACE TSHILOMBO', role: 'Frère', family: 'technique', responsibility: 'TECHNIQUE' },
            { name: 'EPHRAIM KALY NSAPU', role: 'Frère', family: 'technique', responsibility: 'VP TECHNIQUE' },
            { name: 'DEVOS SANDUKU', role: 'Berger', family: 'transport', responsibility: 'TRANSPORT' },
            { name: 'TOUPEMUNI', role: 'Frère', family: 'transport', responsibility: 'VP TRANSPORT' },
            { name: 'FRANCKY', role: 'Frère', family: 'transport', responsibility: '2ème VP' },
            { name: 'PAUL MUTEBA', role: 'Berger', family: 'finances', responsibility: 'FINANCES' },
            { name: 'EULALIE SHIMATA', role: 'Sœur', family: 'finances', responsibility: 'VP FINANCES' },
            { name: 'BERRY BIBOY', role: 'Frère', family: 'partenariat', responsibility: 'PARTENARIAT' },
            { name: 'CLEMENTINE BOMEKI', role: 'Berger', family: 'partenariat', responsibility: 'VP PARTENARIAT 2ème VP PARTENARIAT' },
            { name: 'ZACHARIE AMISI', role: 'Berger', family: 'construction', responsibility: '' },
            { name: 'PAPY KONGOLO', role: 'Berger', family: 'formation-capacites', responsibility: 'CONSTRUCTION FORMATION ET RENFORCEMENT DE CAPACITÉS, 2ème VP FAMILLES, FIANCAILL MARIAGE' },
            { name: 'JEAN-DIDIER BIAKALA', role: 'Berger', family: 'fiancailles', responsibility: '' },
            { name: 'BELLANGE KISALA', role: 'Sœur', family: 'formation-capacites', responsibility: 'VP FORMATION ET RENFORCEMENT DES CAPACITÉS' },
            { name: 'WILLY MUKA', role: 'Berger', family: 'cellules-maisons', responsibility: 'CELLULES DE MAISONS ET EXTENSIONS' },
            { name: 'MARDOCHE MADI', role: 'Berger', family: 'cellules-maisons', responsibility: 'VP CELLULES DE MAISONS ET EXTENSIONS' },
            { name: 'LUC MWEPU', role: 'Frère', family: 'cellules-maisons', responsibility: '2ème VP CELLULES DE MAISONS ET EXTENSIONS' },
            { name: 'JOEL LUMBALA', role: 'Frère', family: 'cenacle-bible', responsibility: 'CENACLE POUR LA LECTURE DE LA BIBLE' },
            { name: 'EMMANUEL KANKU', role: 'Frère', family: 'cenacle-bible', responsibility: 'VP CENACLE POUR LA LECTURE DE LA BIBLE' },
            { name: 'DENIS NGOIE', role: 'Pasteur', family: 'devotion-matinale', responsibility: 'DEVOTION MATINALE' },
            { name: 'BRUNO TSHITENDE', role: 'Berger', family: 'devotion-matinale', responsibility: 'VP DEVOTION MATINALE' },
            { name: 'SYLVAIN LOSALA', role: 'Berger', family: 'finances', responsibility: '2ème VP ECODIM' },
            { name: 'BAMBINI TSHOUMBA', role: 'Frère', family: 'bapteme-sainte-cene', responsibility: 'SAINTE-CENE, VP CONSTRUCTION VP SAINTE-CENE, 2ème VP HOMMES ADULTES' },
            { name: 'OLIVIER SENGA', role: 'Pasteur', family: 'corps-predicateurs', responsibility: 'PASTEUR RESIDENT' },
            { name: 'JEAN-LUC MUYA', role: 'Berger', family: 'jvi', responsibility: '' },
            { name: 'JEAN-RENE LUMBU', role: 'Bergère', family: 'jvi', responsibility: '2ème VP JVI' },
            { name: 'ANNICK MANBO', role: 'Pasteure', family: 'social', responsibility: 'SOCIAL' },
            { name: 'AMI KABONGO', role: 'Berger', family: 'social', responsibility: 'VP SOCIAL HYGIENE ET ENTRETIEN' },
            { name: 'CLAUDINE KABEDI', role: 'Bergère', family: 'construction', responsibility: '2ème VP CONSTRUCTION' },
            { name: 'SAMY MAKENGU', role: 'Pasteur', family: 'corps-predicateurs', responsibility: 'CORPS DES PREDICATEURS' },
            { name: 'OLIVIER SENGA', role: 'Pasteur', family: 'corps-predicateurs', responsibility: 'VP CORPS DE' },
        ];

        for (let i = 0; i < realMembers.length; i++) {
            const member = realMembers[i];
            await setDoc(doc(db, 'members', `member-${i + 1}`), {
                name: member.name,
                role: member.role as any,
                family: member.family,
                status: 'Fidèle',
                gender: member.role.includes('Sœur') || member.role.includes('Bergère') || member.role.includes('Pasteure') ? 'Femme' : 'Homme',
                birthDate: '1990-01-01',
                joinDate: '2024-01-01',
                phone: '+243 800 000 000',
                email: `${member.name.toLowerCase().replace(/\s+/g, '.')}@ncd.cd`,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2563eb&color=fff`,
                ministry: member.responsibility || '',
            });
        }
        console.log(`✅ Added ${realMembers.length} real members`);

        // 5. Add Real 2026 Program Events with correct Date objects
        const real2026Events = [
            {
                id: 'event-2026-01',
                title: 'École de la Communauté',
                // Dates as Strings for reference
                date: '2026-01-04',
                endDate: '2026-01-09',
                time: '09:00',
                // Dates as Timestamps (required by App)
                start: new Date('2026-01-04T09:00:00'),
                end: new Date('2026-01-09T17:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: 'Formation et enseignement pour la communauté',
                type: 'Formation', // Changed from category to type
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-02',
                title: '12 Jours de Prières pour Dédiacaer l\'Année 2026',
                date: '2026-01-19',
                endDate: '2026-01-30',
                time: '06:00',
                start: new Date('2026-01-19T06:00:00'),
                end: new Date('2026-01-30T08:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: '12 jours de prières pour consacrer l\'année 2026',
                type: 'Prière',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-03',
                title: '28 Matinées de Gloire',
                date: '2026-02-01',
                endDate: '2026-02-28',
                time: '06:00',
                start: new Date('2026-02-01T06:00:00'),
                end: new Date('2026-02-28T08:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: 'Mois complet de prières matinales',
                type: 'Prière',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-04',
                title: 'Convention des Sœurs',
                date: '2026-03-04',
                endDate: '2026-03-06',
                time: '09:00',
                start: new Date('2026-03-04T09:00:00'),
                end: new Date('2026-03-06T17:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: 'Convention annuelle des sœurs de l\'église',
                type: 'Convention',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-05',
                title: 'Célébration JVI',
                date: '2026-03-31',
                endDate: '2026-04-03',
                time: '10:00',
                start: new Date('2026-03-31T10:00:00'),
                end: new Date('2026-04-03T20:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: 'Célébration spéciale de la Jeunesse Victorieuse Internationale',
                type: 'Célébration',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-06',
                title: 'Ciel Ouvert - 50 Jours de Prière',
                date: '2026-04-05',
                endDate: '2026-05-24',
                time: '06:00',
                start: new Date('2026-04-05T06:00:00'),
                end: new Date('2026-05-24T08:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: '50 jours de prières intensives pour des percées spirituelles',
                type: 'Prière',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-07',
                title: 'Séminaire Spécial des Couples & Familles',
                date: '2026-06-21',
                endDate: '2026-06-27',
                time: '09:00',
                start: new Date('2026-06-21T09:00:00'),
                end: new Date('2026-06-27T17:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: 'Séminaire de renforcement pour les couples et familles',
                type: 'Séminaire',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-08',
                title: 'Mois Évangélique',
                date: '2026-09-01',
                endDate: '2026-09-30',
                time: '18:00',
                start: new Date('2026-09-01T18:00:00'),
                end: new Date('2026-09-30T20:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: 'Mois entier dédié à l\'évangélisation',
                type: 'Évangélisation',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-09',
                title: 'CONEX 2026',
                date: '2026-10-18',
                endDate: '2026-10-25',
                time: '09:00',
                start: new Date('2026-10-18T09:00:00'),
                end: new Date('2026-10-25T20:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: 'Convention Nationale d\'Excellence 2026',
                type: 'Convention',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-10',
                title: 'Gala d\'Honneur à Karavia',
                date: '2026-10-24',
                endDate: '2026-10-24',
                time: '18:00',
                start: new Date('2026-10-24T18:00:00'),
                end: new Date('2026-10-24T23:00:00'),
                location: 'Pullman Hotel, Grand Karavia',
                description: 'Gala de prestige à Karavia',
                type: 'Célébration',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-11',
                title: 'Prière de Fin d\'Année - 21 Jours de Prière',
                date: '2026-12-04',
                endDate: '2026-12-24',
                time: '06:00',
                start: new Date('2026-12-04T06:00:00'),
                end: new Date('2026-12-24T08:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: '21 jours de prières pour clôturer l\'année en beauté',
                type: 'Prière',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-12',
                title: 'Culte de Noël',
                date: '2026-12-25',
                endDate: '2026-12-25',
                time: '10:00',
                start: new Date('2026-12-25T10:00:00'),
                end: new Date('2026-12-25T12:30:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: 'Célébration de la naissance de Jésus-Christ',
                type: 'Culte',
                organizer: 'NCD Admin',
                status: 'upcoming'
            },
            {
                id: 'event-2026-13',
                title: 'Spécial Réveillon - Jesus le Centre',
                date: '2026-12-31',
                endDate: '2026-12-31',
                time: '22:00',
                start: new Date('2026-12-31T22:00:00'),
                end: new Date('2027-01-01T04:00:00'),
                location: 'Paroisse La Pentecôte CE Nouvelle Cité de David',
                description: 'Célébration du passage à la nouvelle année avec Jésus au centre',
                type: 'Réveillon',
                organizer: 'NCD Admin',
                status: 'upcoming'
            }
        ];

        // Clear existing events first
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        for (const eventDoc of eventsSnapshot.docs) {
            await deleteDoc(doc(db, 'events', eventDoc.id));
        }
        console.log(`✅ Cleared ${eventsSnapshot.size} old events`);

        // Add 2026 program events
        for (const event of real2026Events) {
            await setDoc(doc(db, 'events', event.id), event);
        }
        console.log(`✅ Added ${real2026Events.length} events from 2026 program`);

        console.log('🎉 Real church data loaded successfully!');
        return { success: true };
    } catch (error) {
        console.error('❌ Error loading real data:', error);
        return { success: false, error };
    }
};
