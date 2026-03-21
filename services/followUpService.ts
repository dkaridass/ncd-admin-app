import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FollowUp } from '../types';

const COLLECTION_NAME = 'followUps';

export const followUpService = {
    getAll: async (): Promise<FollowUp[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FollowUp[];
        } catch (e) {
            console.error('Error fetching followUps:', e);
            throw e;
        }
    },

    add: async (followUp: Omit<FollowUp, 'id'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), followUp);
            return docRef.id;
        } catch (e) {
            console.error('Error adding followUp:', e);
            throw e;
        }
    },

    update: async (id: string, updates: Partial<FollowUp>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (e) {
            console.error('Error updating followUp:', e);
            throw e;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (e) {
            console.error('Error deleting followUp:', e);
            throw e;
        }
    },

    resolve: async (id: string, notes?: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                status: 'Résolu',
                resolvedAt: new Date().toISOString(),
                notes: notes || ''
            });
        } catch (e) {
            console.error('Error resolving followUp:', e);
            throw e;
        }
    }
};
