import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc, Timestamp } from 'firebase/firestore';
import { PrayerRequest } from '../types';

const COLLECTION_NAME = 'prayer_requests'; // Note: matches Firestore rules (with underscore)

export const prayerRequestsService = {
    // Get all prayer requests (filtered by privacy rules in Firestore rules)
    getAll: async (): Promise<PrayerRequest[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamps to ISO strings
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
                } as PrayerRequest;
            });
        } catch (error) {
            console.error("Error fetching prayer requests:", error);
            throw error;
        }
    },

    // Get prayer requests by status
    getByStatus: async (status: PrayerRequest['status']): Promise<PrayerRequest[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('status', '==', status),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
                } as PrayerRequest;
            });
        } catch (error) {
            console.error("Error fetching prayer requests by status:", error);
            throw error;
        }
    },

    // Get prayer requests by author (for users to see their own)
    getByAuthor: async (authorId: string): Promise<PrayerRequest[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('authorId', '==', authorId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
                } as PrayerRequest;
            });
        } catch (error) {
            console.error("Error fetching prayer requests by author:", error);
            throw error;
        }
    },

    // Get single prayer request
    getById: async (id: string): Promise<PrayerRequest | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
                } as PrayerRequest;
            }
            return null;
        } catch (error) {
            console.error("Error fetching prayer request:", error);
            throw error;
        }
    },

    // Create prayer request
    add: async (request: Omit<PrayerRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrayerRequest> => {
        try {
            const now = Timestamp.now();
            const requestData = {
                ...request,
                status: request.status || 'En attente',
                createdAt: now,
                updatedAt: now,
                prayedBy: request.prayedBy || [],
            };
            const docRef = await addDoc(collection(db, COLLECTION_NAME), requestData);
            return {
                id: docRef.id,
                ...request,
                status: request.status || 'En attente',
                createdAt: now.toDate().toISOString(),
                updatedAt: now.toDate().toISOString(),
                prayedBy: request.prayedBy || [],
            } as PrayerRequest;
        } catch (error) {
            console.error("Error adding prayer request:", error);
            throw error;
        }
    },

    // Update prayer request
    update: async (id: string, updates: Partial<PrayerRequest>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const updateData: any = {
                ...updates,
                updatedAt: Timestamp.now(),
            };
            // Remove id from updates (it's the document ID)
            delete updateData.id;
            // Convert ISO strings back to Timestamps if needed
            if (updateData.createdAt && typeof updateData.createdAt === 'string') {
                updateData.createdAt = Timestamp.fromDate(new Date(updateData.createdAt));
            }
            await updateDoc(docRef, updateData);
        } catch (error) {
            console.error("Error updating prayer request:", error);
            throw error;
        }
    },

    // Update status only (convenience method)
    updateStatus: async (id: string, status: PrayerRequest['status']): Promise<void> => {
        try {
            await prayerRequestsService.update(id, { status });
        } catch (error) {
            console.error("Error updating prayer request status:", error);
            throw error;
        }
    },

    // Mark as prayed (add user to prayedBy array)
    markAsPrayed: async (id: string, userId: string): Promise<void> => {
        try {
            const request = await prayerRequestsService.getById(id);
            if (!request) throw new Error('Prayer request not found');
            const prayedBy = request.prayedBy || [];
            if (!prayedBy.includes(userId)) {
                prayedBy.push(userId);
                await prayerRequestsService.update(id, { prayedBy });
            }
        } catch (error) {
            console.error("Error marking prayer request as prayed:", error);
            throw error;
        }
    },

    // Delete prayer request
    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting prayer request:", error);
            throw error;
        }
    }
};
