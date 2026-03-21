import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { PastoralBriefing } from '../types';

const COLLECTION_NAME = 'pastoral_briefings';

export const briefingsService = {
    add: async (briefing: Omit<PastoralBriefing, 'id'>): Promise<PastoralBriefing> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), briefing);
            return { id: docRef.id, ...briefing } as PastoralBriefing;
        } catch (error) {
            console.error("Error adding briefing:", error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<PastoralBriefing>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating briefing:", error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting briefing:", error);
            throw error;
        }
    }
};
