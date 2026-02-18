import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, increment } from 'firebase/firestore';
import { Resource } from '../types';

const COLLECTION_NAME = 'resources';

export const resourcesService = {
    /**
     * Get all resources, ordered by creation date (newest first)
     */
    getAll: async (): Promise<Resource[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        } catch (error) {
            console.error("Error fetching resources:", error);
            throw error;
        }
    },

    /**
     * Get active resources only
     */
    getActive: async (): Promise<Resource[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        } catch (error) {
            console.error("Error fetching active resources:", error);
            // Fallback: fetch all and filter in memory
            const all = await resourcesService.getAll();
            return all.filter(res => res.isActive);
        }
    },

    /**
     * Get resources by category
     */
    getByCategory: async (category: Resource['category']): Promise<Resource[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('category', '==', category),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        } catch (error) {
            console.error("Error fetching resources by category:", error);
            throw error;
        }
    },

    /**
     * Get resources by type
     */
    getByType: async (type: Resource['type']): Promise<Resource[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('type', '==', type),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        } catch (error) {
            console.error("Error fetching resources by type:", error);
            throw error;
        }
    },

    /**
     * Add a new resource
     */
    add: async (resource: Omit<Resource, 'id'>): Promise<Resource> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), resource);
            return { id: docRef.id, ...resource } as Resource;
        } catch (error) {
            console.error("Error adding resource:", error);
            throw error;
        }
    },

    /**
     * Update an existing resource
     */
    update: async (id: string, updates: Partial<Resource>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating resource:", error);
            throw error;
        }
    },

    /**
     * Delete a resource
     */
    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting resource:", error);
            throw error;
        }
    },

    /**
     * Increment download count
     */
    incrementDownloadCount: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, { downloadCount: increment(1) });
        } catch (error) {
            console.error("Error incrementing download count:", error);
            throw error;
        }
    }
};
