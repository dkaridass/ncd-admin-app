import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Department } from '../types';

const COLLECTION_NAME = 'departments';

export const departmentsService = {
    getAll: async (): Promise<Department[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        } catch (error) {
            console.error("Error fetching departments:", error);
            throw error;
        }
    },

    add: async (dept: Omit<Department, 'id'>): Promise<Department> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), dept);
            return { id: docRef.id, ...dept } as Department;
        } catch (error) {
            console.error("Error adding department:", error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<Department>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating department:", error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting department:", error);
            throw error;
        }
    }
};
