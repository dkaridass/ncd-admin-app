import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { DepartmentReport } from '../types';

const COLLECTION_NAME = 'departmentReports';

export const reportsService = {
    getAll: async (): Promise<DepartmentReport[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('submittedAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepartmentReport));
        } catch (error) {
            console.error("Error fetching reports:", error);
            throw error;
        }
    },

    add: async (report: Omit<DepartmentReport, 'id'>): Promise<DepartmentReport> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), report);
            return { id: docRef.id, ...report } as DepartmentReport;
        } catch (error) {
            console.error("Error adding report:", error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<DepartmentReport>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating report:", error);
            throw error;
        }
    },

    delete: async (id: string, storagePath?: string): Promise<void> => {
        try {
            // Best-effort delete of attached file if we know the storage path
            if (storagePath) {
                try {
                    const storage = getStorage();
                    const fileRef = ref(storage, storagePath);
                    await deleteObject(fileRef);
                } catch (storageError) {
                    console.warn("Warning: failed to delete report attachment from storage", storageError);
                }
            }

            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting report:", error);
            throw error;
        }
    }
};
