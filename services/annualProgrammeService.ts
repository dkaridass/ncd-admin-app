import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { AnnualEvent } from '../types';

const COLLECTION_NAME = 'annualProgramme';

export const annualProgrammeService = {
    getAll: async (): Promise<AnnualEvent[]> => {
        try {
            // Fetch all, sort in memory to avoid index requirement
            const q = collection(db, COLLECTION_NAME);
            const snapshot = await getDocs(q);
            const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnnualEvent));
            
            // Sort by startDate in memory
            events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            
            return events;
        } catch (error) {
            console.error("Error fetching annual programme:", error);
            throw error;
        }
    },

    getByYear: async (year: number): Promise<AnnualEvent[]> => {
        try {
            // Fetch with filters, sort in memory to avoid index requirement
            const q = query(
                collection(db, COLLECTION_NAME),
                where('year', '==', year),
                where('isActive', '==', true)
            );
            const snapshot = await getDocs(q);
            const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnnualEvent));
            
            // Sort by startDate in memory
            events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            
            return events;
        } catch (error) {
            console.error("Error fetching annual programme by year:", error);
            throw error;
        }
    },

    getUpcoming: async (limit: number = 5): Promise<AnnualEvent[]> => {
        try {
            const today = new Date().toISOString().split('T')[0];
            // Fetch with filters, sort in memory to avoid index requirement
            const q = query(
                collection(db, COLLECTION_NAME),
                where('startDate', '>=', today),
                where('isActive', '==', true)
            );
            const snapshot = await getDocs(q);
            const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnnualEvent));
            
            // Sort by startDate in memory
            events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            
            return events.slice(0, limit);
        } catch (error) {
            console.error("Error fetching upcoming annual events:", error);
            throw error;
        }
    },

    add: async (event: Omit<AnnualEvent, 'id'>): Promise<AnnualEvent> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), event);
            return { id: docRef.id, ...event } as AnnualEvent;
        } catch (error) {
            console.error("Error adding annual event:", error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<AnnualEvent>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating annual event:", error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting annual event:", error);
            throw error;
        }
    },

    // Initialize 2026 Annual Programme from the poster
    initialize2026: async (): Promise<number> => {
        const events2026: Omit<AnnualEvent, 'id'>[] = [
            {
                title: 'ÉCOLE DE LA COMMUNAUTÉ',
                description: 'Formation et enseignement de la communauté',
                startDate: '2026-01-04',
                endDate: '2026-01-09',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'école',
                year: 2026,
                organizer: 'Direction',
                isActive: true
            },
            {
                title: '12 JOURS DE PRIÈRES POUR DÉDICACER L\'ANNÉE 2026',
                description: 'Temps de prière et dédicace pour l\'année 2026',
                startDate: '2026-01-19',
                endDate: '2026-01-30',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'prière',
                year: 2026,
                organizer: 'Intercession',
                isActive: true
            },
            {
                title: '28 MATINÉES DE GLOIRE',
                description: 'Temps de gloire matinal',
                startDate: '2026-02-01',
                endDate: '2026-02-28',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'prière',
                year: 2026,
                organizer: 'Dévotion Matinale',
                isActive: true
            },
            {
                title: 'CONVENTION DES SŒURS',
                description: 'Rassemblement des femmes de la communauté',
                startDate: '2026-03-04',
                endDate: '2026-03-06',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'convention',
                year: 2026,
                organizer: 'Dépt Sœurs',
                isActive: true
            },
            {
                title: 'CÉLÉBRATION JVI',
                description: 'Jeunesse Visionnaire - Célébration',
                startDate: '2026-03-31',
                endDate: '2026-04-03',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'célébration',
                year: 2026,
                organizer: 'JVI',
                isActive: true
            },
            {
                title: 'CIEL OUVERT 50 JOURS DE PRIERE',
                description: '50 jours de prière intensive',
                startDate: '2026-04-05',
                endDate: '2026-05-24',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'prière',
                year: 2026,
                organizer: 'Intercession',
                isActive: true
            },
            {
                title: 'SEMINAIRE SPECIAL DES COUPLE & FAMILLES',
                description: 'Séminaire spécial pour couples et familles',
                startDate: '2026-06-21',
                endDate: '2026-06-27',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'séminaire',
                year: 2026,
                organizer: 'Dépt Famille',
                isActive: true
            },
            {
                title: 'MOIS ÉVANGÉLIQUE',
                description: 'Mois d\'évangélisation intensive',
                startDate: '2026-09-01',
                endDate: '2026-09-30',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'mois',
                year: 2026,
                organizer: 'Évangélisation',
                isActive: true
            },
            {
                title: 'CONEX 2026',
                description: 'Convention d\'Excellence 2026',
                startDate: '2026-10-18',
                endDate: '2026-10-25',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'convention',
                year: 2026,
                organizer: 'Direction',
                isActive: true
            },
            {
                title: 'GALA D\'HONNEUR À KARAVIA',
                description: 'Gala d\'honneur à Karavia',
                startDate: '2026-10-24',
                endDate: '2026-10-24',
                location: 'PULLMAN HOTEL GRAND KARAVIA',
                category: 'gala',
                year: 2026,
                organizer: 'Protocole',
                isActive: true
            },
            {
                title: 'PRIÈRE DE FIN D\'ANNÉE 21 JOURS DE PRIERE',
                description: '21 jours de prière pour clôturer l\'année',
                startDate: '2026-12-04',
                endDate: '2026-12-24',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'prière',
                year: 2026,
                organizer: 'Intercession',
                isActive: true
            },
            {
                title: 'CULTE DE NOËL',
                description: 'Célébration de Noël',
                startDate: '2026-12-25',
                endDate: '2026-12-25',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'célébration',
                year: 2026,
                organizer: 'Direction',
                isActive: true
            },
            {
                title: 'SPECIAL RÉVEILLON JESUS LE CENTRE',
                description: 'Réveillon spécial - Jésus le Centre',
                startDate: '2026-12-31',
                endDate: '2026-12-31',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                category: 'célébration',
                year: 2026,
                organizer: 'Direction',
                isActive: true
            }
        ];

        try {
            // Check if 2026 events already exist (simple check without filters to avoid index)
            const allEvents = await annualProgrammeService.getAll();
            const existing2026 = allEvents.filter(e => e.year === 2026 && e.isActive);
            if (existing2026.length > 0) {
                console.log('2026 Annual Programme already initialized');
                return existing2026.length;
            }

            // Add all 2026 events
            const batch = writeBatch(db);
            events2026.forEach(event => {
                const docRef = doc(collection(db, COLLECTION_NAME));
                batch.set(docRef, event);
            });
            await batch.commit();
            console.log(`✅ Initialized ${events2026.length} annual events for 2026`);
            return events2026.length;
        } catch (error) {
            console.error("Error initializing 2026 annual programme:", error);
            throw error;
        }
    }
};
