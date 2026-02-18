import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { WeeklyService } from '../types';

const COLLECTION_NAME = 'weeklyServices';

export const weeklyServicesService = {
    getAll: async (): Promise<WeeklyService[]> => {
        try {
            // Fetch all without ordering (to avoid index requirement)
            // We'll sort in memory instead
            const q = collection(db, COLLECTION_NAME);
            const snapshot = await getDocs(q);
            const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeeklyService));
            
            // Sort in memory by dayOfWeek and order
            const dayOrder = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            services.sort((a, b) => {
                const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
                if (dayDiff !== 0) return dayDiff;
                return (a.order || 0) - (b.order || 0);
            });
            
            return services;
        } catch (error) {
            console.error("Error fetching weekly services:", error);
            throw error;
        }
    },

    getByDay: async (dayOfWeek: WeeklyService['dayOfWeek']): Promise<WeeklyService[]> => {
        try {
            // Fetch with day filter only, sort in memory
            const q = query(
                collection(db, COLLECTION_NAME),
                where('dayOfWeek', '==', dayOfWeek),
                where('isActive', '==', true)
            );
            const snapshot = await getDocs(q);
            const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeeklyService));
            
            // Sort by order in memory
            services.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            return services;
        } catch (error) {
            console.error("Error fetching weekly services by day:", error);
            throw error;
        }
    },

    add: async (service: Omit<WeeklyService, 'id'>): Promise<WeeklyService> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), service);
            return { id: docRef.id, ...service } as WeeklyService;
        } catch (error) {
            console.error("Error adding weekly service:", error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<WeeklyService>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating weekly service:", error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting weekly service:", error);
            throw error;
        }
    },

    // Initialize default NCD weekly services
    initializeDefaults: async (): Promise<number> => {
        const defaultServices: Omit<WeeklyService, 'id'>[] = [
            // Mercredi
            {
                dayOfWeek: 'Mercredi',
                serviceName: 'Culte',
                startTime: '16:30',
                endTime: '18:30',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                description: 'Enseignement et prière',
                order: 1,
                isActive: true
            },
            // Vendredi
            {
                dayOfWeek: 'Vendredi',
                serviceName: 'Culte',
                startTime: '16:30',
                endTime: '18:30',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                description: 'Enseignement et prière',
                order: 1,
                isActive: true
            },
            // Dimanche - 1er culte
            {
                dayOfWeek: 'Dimanche',
                serviceName: '1er culte',
                startTime: '07:20',
                endTime: '09:20',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                description: 'Culte de louange et adoration',
                order: 1,
                isActive: true
            },
            // Dimanche - 2ème culte
            {
                dayOfWeek: 'Dimanche',
                serviceName: '2ème culte',
                startTime: '09:30',
                endTime: '11:30',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                description: 'Culte de louange et adoration',
                order: 2,
                isActive: true
            },
            // Dimanche - 3ème culte
            {
                dayOfWeek: 'Dimanche',
                serviceName: '3ème culte',
                startTime: '16:00',
                endTime: '18:00',
                location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David',
                description: 'Culte de louange et adoration',
                order: 3,
                isActive: true
            }
        ];

        try {
            // Check if services already exist
            const existing = await weeklyServicesService.getAll();
            if (existing.length > 0) {
                console.log('Weekly services already initialized');
                return existing.length;
            }

            // Add all default services
            const batch = writeBatch(db);
            defaultServices.forEach(service => {
                const docRef = doc(collection(db, COLLECTION_NAME));
                batch.set(docRef, service);
            });
            await batch.commit();
            console.log(`✅ Initialized ${defaultServices.length} weekly services`);
            return defaultServices.length;
        } catch (error) {
            console.error("Error initializing weekly services:", error);
            throw error;
        }
    }
};
