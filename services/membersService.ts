import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { Member } from '../types';

const COLLECTION_NAME = 'members';

export const membersService = {
    // Get all members
    getAll: async (): Promise<Member[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        } catch (error) {
            console.error("Error fetching members:", error);
            throw error;
        }
    },

    // Get single member
    getById: async (id: string): Promise<Member | null> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Member;
            }
            return null;
        } catch (error) {
            console.error("Error fetching member:", error);
            throw error;
        }
    },

    // Add member
    add: async (member: Omit<Member, 'id'>): Promise<Member> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), member);
            return { id: docRef.id, ...member } as Member;
        } catch (error) {
            console.error("Error adding member:", error);
            throw error;
        }
    },

    // Update member
    update: async (id: string, updates: Partial<Member>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            
            // Filter out undefined values - Firestore doesn't accept undefined
            const cleanUpdates: any = {};
            
            // Process all keys, including those explicitly set to undefined
            for (const key in updates) {
                if (updates.hasOwnProperty(key)) {
                    const value = (updates as any)[key];
                    
                    // Special handling for departmentIds - always ensure it's an array
                    if (key === 'departmentIds') {
                        // If undefined or null, set to empty array
                        if (value === undefined || value === null) {
                            cleanUpdates[key] = [];
                        } else if (Array.isArray(value)) {
                            cleanUpdates[key] = value;
                        } else {
                            cleanUpdates[key] = [];
                        }
                    } else {
                        // For all other fields, only include if not undefined
                        if (value !== undefined) {
                            cleanUpdates[key] = value;
                        }
                    }
                }
            }
            
            // Double-check: if departmentIds was explicitly in updates but is undefined, set to empty array
            if ('departmentIds' in updates && (updates.departmentIds === undefined || updates.departmentIds === null)) {
                cleanUpdates.departmentIds = [];
            }
            
            console.log('🔧 Sanitized updates:', cleanUpdates);
            console.log('🔧 Original updates:', updates);
            
            await updateDoc(docRef, cleanUpdates);
        } catch (error) {
            console.error("❌ Error updating member:", error);
            console.error("❌ Update data:", updates);
            throw error;
        }
    },

    // Delete member
    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting member:", error);
            throw error;
        }
    }
};
