import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, limit } from 'firebase/firestore';
import { FinanceRecord } from '../types';

const COLLECTION_NAME = 'finances';

export const financeService = {
    // Get recent transactions (limit to 200 for performance)
    getAll: async (): Promise<FinanceRecord[]> => {
        try {
            // Updated query to be more standard.
            // Note: complex queries with orderBy usually require an index.
            // If writes are happening but reads are empty, it's often a missing index or cache issue.
            // For now, we fetch all and sort in memory if needed, or trust the simple index.
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('date', 'desc'),
                limit(200)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure account defaults to 'Cash' for old records
                    account: data.account || 'Cash'
                } as FinanceRecord;
            });
        } catch (error) {
            console.error("Error fetching finances:", error);
            // Fallback: try fetching without ordering if index is missing
            try {
                const simpleQ = query(collection(db, COLLECTION_NAME), limit(200));
                const snapshot = await getDocs(simpleQ);
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    account: doc.data().account || 'Cash'
                } as FinanceRecord)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            } catch (retryError) {
                console.error("Retry fetch failed:", retryError);
                throw retryError;
            }
        }
    },

    // Add transaction - Enhanced with Account support and Logging
    add: async (record: Omit<FinanceRecord, 'id'>): Promise<FinanceRecord> => {
        try {
            console.log("Attempting to add finance record:", record);

            // Validate basic fields
            if (!record.amount || !record.date || !record.type) {
                throw new Error("Missing required fields (amount, date, type)");
            }

            // Ensure account is set and Sanitize undefined values (Firestore rejects undefined)
            const recordWithAccount = {
                ...record,
                account: record.account || 'Cash'
            };

            // Remove undefined keys
            Object.keys(recordWithAccount).forEach(key => {
                if ((recordWithAccount as any)[key] === undefined) {
                    delete (recordWithAccount as any)[key];
                }
            });

            const docRef = await addDoc(collection(db, COLLECTION_NAME), recordWithAccount);
            console.log("Finance record added with ID:", docRef.id);

            return { id: docRef.id, ...recordWithAccount } as FinanceRecord;
        } catch (error) {
            console.error("Error adding finance record:", error);
            throw error;
        }
    },

    // Approve transaction (for admins)
    approve: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, { isApproved: true });
        } catch (error) {
            console.error("Error approving finance record:", error);
            throw error;
        }
    },

    // Update transaction
    update: async (id: string, updates: Partial<FinanceRecord>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            // Sanitize updates
            const sanitizedUpdates = { ...updates };
            Object.keys(sanitizedUpdates).forEach(key => {
                if ((sanitizedUpdates as any)[key] === undefined) {
                    delete (sanitizedUpdates as any)[key];
                }
            });
            await updateDoc(docRef, sanitizedUpdates);
            console.log("Finance record updated:", id);
        } catch (error) {
            console.error("Error updating finance record:", error);
            throw error;
        }
    },

    // Delete transaction
    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
            console.log("Finance record deleted:", id);
        } catch (error) {
            console.error("Error deleting finance record:", error);
            throw error;
        }
    }
};
