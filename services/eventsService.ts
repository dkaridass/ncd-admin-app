import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { Event } from '../types';

const COLLECTION_NAME = 'events';

export const eventsService = {
    getAll: async (): Promise<Event[]> => {
        try {
            // Fetch ALL docs, don't filter by 'start' in query (avoids excluding docs with missing field)
            const q = query(collection(db, COLLECTION_NAME));
            const snapshot = await getDocs(q);

            const events = snapshot.docs.map(doc => {
                const data = doc.data();
                // Safe date conversion with fallback to prevent crashes
                const start = data.start ? (data.start instanceof Timestamp ? data.start.toDate() : new Date(data.start)) : new Date(data.date || Date.now());
                const end = data.end ? (data.end instanceof Timestamp ? data.end.toDate() : new Date(data.end)) : new Date(data.endDate || start);

                return {
                    id: doc.id,
                    ...data,
                    start,
                    end,
                    // Ensure type exists (fallback to category if needed)
                    type: data.type || data.category || 'Événement'
                } as Event;
            });

            // Sort in memory
            return events.sort((a, b) => a.start.getTime() - b.start.getTime());
        } catch (error) {
            console.error("Error fetching events:", error);
            throw error;
        }
    },

    add: async (event: Omit<Event, 'id'>): Promise<Event> => {
        try {
            // Ensure we save actual Dates/Timestamps
            const docRef = await addDoc(collection(db, COLLECTION_NAME), event);
            return { id: docRef.id, ...event } as Event;
        } catch (error) {
            console.error("Error adding event:", error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<Event>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating event:", error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting event:", error);
            throw error;
        }
    },

    toggleRsvp: async (eventId: string, memberId: string, currentRsvps?: string[]): Promise<void> => {
        try {
            // I7 fix: Use arrayUnion/arrayRemove for atomic operations
            const { arrayUnion, arrayRemove } = await import('firebase/firestore');
            const rsvps = currentRsvps || [];
            if (rsvps.includes(memberId)) {
                await updateDoc(doc(db, COLLECTION_NAME, eventId), { rsvps: arrayRemove(memberId) });
            } else {
                await updateDoc(doc(db, COLLECTION_NAME, eventId), { rsvps: arrayUnion(memberId) });
            }
        } catch (error) {
            console.error("Error toggling RSVP:", error);
            throw error;
        }
    }
};
