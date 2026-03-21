import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { SermonPlan } from '../types';

const COLLECTION_NAME = 'sermon_plans';

export const sermonsService = {
    add: async (sermon: Omit<SermonPlan, 'id'>): Promise<SermonPlan> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), sermon);
            return { id: docRef.id, ...sermon } as SermonPlan;
        } catch (error) {
            console.error("Error adding sermon:", error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<SermonPlan>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating sermon:", error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting sermon:", error);
            throw error;
        }
    }
};
