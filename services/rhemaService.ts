import { aiService } from './aiService';

import { db } from '../firebase';
import { collection, getDocs, query, where, limit, addDoc, orderBy } from 'firebase/firestore';
import { DailyRhema } from '../types';

const COLLECTION_NAME = 'rhema';

export const rhemaService = {
    // Generate a new Rhema for a specific date using Groq
    generateDailyRhema: async (dateStr: string): Promise<DailyRhema | null> => {
        try {
            console.log(`🚀 Generating Rhema for ${dateStr} via Groq...`);

            // Check if Groq is configured
            if (!aiService.isConfigured()) {
                console.warn('⚠️ Groq API key not configured, falling back to Bible verses');
                return await rhemaService.generateFallbackRhema(dateStr);
            }

            const data = await aiService.generateDailyRhema(dateStr);

            if (!data) {
                throw new Error("Failed to generate Rhema");
            }

            const newRhema: Omit<DailyRhema, 'id'> = {
                date: dateStr,
                content: data.content,
                reference: data.reference,
                theme: data.theme,
                meditation: data.meditation || '',
                author: data.author || 'Inspiration Divine'
            };

            // Save to Firestore
            const savedRhema = await rhemaService.add(newRhema);
            console.log(`✅ Rhéma généré par IA: ${data.reference} — ${data.theme}`);
            return savedRhema;

        } catch (error) {
            console.error("Error generating Rhema:", error);

            // FALLBACK: Use curated Bible verses when Groq fails
            console.log("📖 Groq failed, falling back to curated verses...");
            return await rhemaService.generateFallbackRhema(dateStr);
        }
    },

    /**
     * Generate a Rhema using Bible API as fallback
     * Used when Groq API fails or quota is exceeded
     */
    generateFallbackRhema: async (dateStr: string): Promise<DailyRhema | null> => {
        try {
            const { getDailyFrenchVerse } = await import('../data/frenchBibleVerses');
            const verse = getDailyFrenchVerse(dateStr);

            if (!verse) {
                console.error("French verse selection failed");
                return null;
            }

            const newRhema: Omit<DailyRhema, 'id'> = {
                date: dateStr,
                content: verse.text,
                reference: verse.referenceFr,
                theme: verse.theme,
                meditation: `Aujourd'hui, méditons sur ce verset qui nous ramène à Jésus. Que Sa Parole transforme notre journée et renouvelle notre focus sur Lui.`,
                author: "Parole de Dieu (Louis Segond)"
            };

            const savedRhema = await rhemaService.add(newRhema);
            console.log("✅ Rhéma fallback créé:", verse.referenceFr);
            return savedRhema;

        } catch (error) {
            console.error("Erreur génération Rhéma fallback:", error);
            return null;
        }
    },

    // Get Rhema for a specific date, or the latest available if not found
    getForDate: async (dateStr: string): Promise<DailyRhema | null> => {
        try {
            // 1. Try exact match
            const q = query(
                collection(db, COLLECTION_NAME),
                where('date', '==', dateStr),
                limit(1)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() } as DailyRhema;
            }

            // 2. Fallback: Get most recent one
            console.log(`No Rhema found for ${dateStr}, fetching latest fallback.`);
            const fallbackQ = query(
                collection(db, COLLECTION_NAME),
                orderBy('date', 'desc'),
                limit(1)
            );

            const fallbackSnapshot = await getDocs(fallbackQ);

            if (!fallbackSnapshot.empty) {
                const doc = fallbackSnapshot.docs[0];
                return { id: doc.id, ...doc.data() } as DailyRhema;
            }

            return null;
        } catch (error) {
            console.error("Error fetching daily rhema:", error);
            return null;
        }
    },

    // Add a new Rhema (for seeding or admin UI)
    add: async (rhema: Omit<DailyRhema, 'id'>): Promise<DailyRhema> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), rhema);
            return { id: docRef.id, ...rhema } as DailyRhema;
        } catch (error) {
            console.error("Error adding rhema:", error);
            throw error;
        }
    },

    // Update an existing Rhema
    update: async (id: string, updates: Partial<DailyRhema>): Promise<void> => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating rhema:", error);
            throw error;
        }
    },

    // Delete a Rhema
    delete: async (id: string): Promise<void> => {
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting rhema:", error);
            throw error;
        }
    },

    // Get all Rhema (for Admin UI)
    getAll: async (): Promise<DailyRhema[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('date', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyRhema));
        } catch (error) {
            console.error("Error fetching all rhema:", error);
            return [];
        }
    }
};
