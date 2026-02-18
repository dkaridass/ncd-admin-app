import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Announcement } from '../types';

const COLLECTION_NAME = 'announcements';

export const announcementsService = {
    /**
     * Get all announcements, ordered by creation date (newest first)
     */
    getAll: async (): Promise<Announcement[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        } catch (error) {
            console.error("Error fetching announcements:", error);
            throw error;
        }
    },

    /**
     * Get active announcements (not archived, within date range)
     */
    getActive: async (): Promise<Announcement[]> => {
        try {
            const now = new Date().toISOString();
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isActive', '==', true),
                where('isArchived', '==', false),
                orderBy('startDate', 'desc')
            );
            const snapshot = await getDocs(q);
            const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
            
            // Filter by date range in memory (Firestore doesn't support multiple range queries easily)
            return announcements.filter(ann => {
                const startDate = new Date(ann.startDate);
                const endDate = ann.endDate ? new Date(ann.endDate) : null;
                const nowDate = new Date(now);
                return startDate <= nowDate && (!endDate || endDate >= nowDate);
            });
        } catch (error) {
            console.error("Error fetching active announcements:", error);
            // Fallback: fetch all and filter in memory
            const all = await announcementsService.getAll();
            const now = new Date().toISOString();
            return all.filter(ann => {
                if (!ann.isActive || ann.isArchived) return false;
                const startDate = new Date(ann.startDate);
                const endDate = ann.endDate ? new Date(ann.endDate) : null;
                const nowDate = new Date(now);
                return startDate <= nowDate && (!endDate || endDate >= nowDate);
            });
        }
    },

    /**
     * Get announcements by category
     */
    getByCategory: async (category: Announcement['category']): Promise<Announcement[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('category', '==', category),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        } catch (error) {
            console.error("Error fetching announcements by category:", error);
            throw error;
        }
    },

    /**
     * Get announcements by target audience
     */
    getByTarget: async (target: Announcement['target']): Promise<Announcement[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('target', '==', target),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        } catch (error) {
            console.error("Error fetching announcements by target:", error);
            throw error;
        }
    },

    /**
     * Add a new announcement
     */
    add: async (announcement: Omit<Announcement, 'id'>): Promise<Announcement> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), announcement);
            return { id: docRef.id, ...announcement } as Announcement;
        } catch (error) {
            console.error("Error adding announcement:", error);
            throw error;
        }
    },

    /**
     * Update an existing announcement
     */
    update: async (id: string, updates: Partial<Announcement>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating announcement:", error);
            throw error;
        }
    },

    /**
     * Delete an announcement
     */
    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting announcement:", error);
            throw error;
        }
    },

    /**
     * Archive an announcement (soft delete)
     */
    archive: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, { isArchived: true, isActive: false });
        } catch (error) {
            console.error("Error archiving announcement:", error);
            throw error;
        }
    }
};
