import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { AttendanceRecord } from '../types';

const COLLECTION_NAME = 'attendance';

export const attendanceService = {
    getAll: async (): Promise<AttendanceRecord[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
        } catch (error) {
            console.error("Error fetching attendance:", error);
            throw error;
        }
    },

    add: async (record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), record);
            return { id: docRef.id, ...record } as AttendanceRecord;
        } catch (error) {
            console.error("Error adding attendance:", error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<AttendanceRecord>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating attendance:", error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting attendance:", error);
            throw error;
        }
    }
};
