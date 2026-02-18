import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AppSettings, AppSettingsGeneral, AppSettingsFinance, AppSettingsRolesAndFunctions, AppSettingsProgramme, AppSettingsAI } from '../types';

const COLLECTION_NAME = 'appSettings';

// Document IDs
const DOC_IDS = {
  GENERAL: 'general',
  FINANCE: 'finance',
  ROLES_AND_FUNCTIONS: 'rolesAndFunctions',
  PROGRAMME: 'programme',
  AI: 'ai'
};

export const appSettingsService = {
    /**
     * Get all app settings
     */
    getAll: async (): Promise<AppSettings | null> => {
        try {
            const [generalDoc, financeDoc, rolesDoc, programmeDoc, aiDoc] = await Promise.all([
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.GENERAL)),
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.FINANCE)),
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.ROLES_AND_FUNCTIONS)),
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.PROGRAMME)),
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.AI))
            ]);

            if (!generalDoc.exists() || !financeDoc.exists() || !rolesDoc.exists() || !programmeDoc.exists() || !aiDoc.exists()) {
                // Initialize defaults if any document is missing
                await appSettingsService.initializeDefaults();
                return appSettingsService.getAll(); // Retry after initialization
            }

            return {
                general: generalDoc.data() as AppSettingsGeneral,
                finance: financeDoc.data() as AppSettingsFinance,
                rolesAndFunctions: rolesDoc.data() as AppSettingsRolesAndFunctions,
                programme: programmeDoc.data() as AppSettingsProgramme,
                ai: aiDoc.data() as AppSettingsAI
            };
        } catch (error) {
            console.error("Error fetching app settings:", error);
            throw error;
        }
    },

    /**
     * Get general settings
     */
    getGeneral: async (): Promise<AppSettingsGeneral | null> => {
        try {
            const docSnap = await getDoc(doc(db, COLLECTION_NAME, DOC_IDS.GENERAL));
            if (docSnap.exists()) {
                return docSnap.data() as AppSettingsGeneral;
            }
            return null;
        } catch (error) {
            console.error("Error fetching general settings:", error);
            throw error;
        }
    },

    /**
     * Get finance settings
     */
    getFinance: async (): Promise<AppSettingsFinance | null> => {
        try {
            const docSnap = await getDoc(doc(db, COLLECTION_NAME, DOC_IDS.FINANCE));
            if (docSnap.exists()) {
                return docSnap.data() as AppSettingsFinance;
            }
            return null;
        } catch (error) {
            console.error("Error fetching finance settings:", error);
            throw error;
        }
    },

    /**
     * Get roles and functions settings
     */
    getRolesAndFunctions: async (): Promise<AppSettingsRolesAndFunctions | null> => {
        try {
            const docSnap = await getDoc(doc(db, COLLECTION_NAME, DOC_IDS.ROLES_AND_FUNCTIONS));
            if (docSnap.exists()) {
                return docSnap.data() as AppSettingsRolesAndFunctions;
            }
            return null;
        } catch (error) {
            console.error("Error fetching roles and functions settings:", error);
            throw error;
        }
    },

    /**
     * Get programme settings
     */
    getProgramme: async (): Promise<AppSettingsProgramme | null> => {
        try {
            const docSnap = await getDoc(doc(db, COLLECTION_NAME, DOC_IDS.PROGRAMME));
            if (docSnap.exists()) {
                return docSnap.data() as AppSettingsProgramme;
            }
            return null;
        } catch (error) {
            console.error("Error fetching programme settings:", error);
            throw error;
        }
    },

    /**
     * Get AI settings
     */
    getAI: async (): Promise<AppSettingsAI | null> => {
        try {
            const docSnap = await getDoc(doc(db, COLLECTION_NAME, DOC_IDS.AI));
            if (docSnap.exists()) {
                return docSnap.data() as AppSettingsAI;
            }
            return null;
        } catch (error) {
            console.error("Error fetching AI settings:", error);
            throw error;
        }
    },

    /**
     * Update general settings
     */
    updateGeneral: async (settings: Partial<AppSettingsGeneral>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, DOC_IDS.GENERAL);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, settings);
            } else {
                await setDoc(docRef, settings);
            }
        } catch (error) {
            console.error("Error updating general settings:", error);
            throw error;
        }
    },

    /**
     * Update finance settings
     */
    updateFinance: async (settings: Partial<AppSettingsFinance>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, DOC_IDS.FINANCE);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, settings);
            } else {
                await setDoc(docRef, settings);
            }
        } catch (error) {
            console.error("Error updating finance settings:", error);
            throw error;
        }
    },

    /**
     * Update roles and functions settings
     */
    updateRolesAndFunctions: async (settings: Partial<AppSettingsRolesAndFunctions>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, DOC_IDS.ROLES_AND_FUNCTIONS);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, settings);
            } else {
                await setDoc(docRef, settings);
            }
        } catch (error) {
            console.error("Error updating roles and functions settings:", error);
            throw error;
        }
    },

    /**
     * Update programme settings
     */
    updateProgramme: async (settings: Partial<AppSettingsProgramme>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, DOC_IDS.PROGRAMME);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, settings);
            } else {
                await setDoc(docRef, settings);
            }
        } catch (error) {
            console.error("Error updating programme settings:", error);
            throw error;
        }
    },

    /**
     * Update AI settings
     */
    updateAI: async (settings: Partial<AppSettingsAI>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, DOC_IDS.AI);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, settings);
            } else {
                await setDoc(docRef, settings);
            }
        } catch (error) {
            console.error("Error updating AI settings:", error);
            throw error;
        }
    },

    /**
     * Initialize default settings
     */
    initializeDefaults: async (): Promise<void> => {
        try {
            // Default General Settings
            const defaultGeneral: AppSettingsGeneral = {
                churchName: 'NCD La Pentecôte',
                city: 'Lubumbashi',
                country: 'RD Congo',
                email: 'contact@ncd.cd',
                pastorName: 'Dr Jean-Clément Diambilay',
                serviceTimes: 'Dimanche 8h00, 10h30 | Mercredi 17h00'
            };

            // Default Finance Settings
            const defaultFinance: AppSettingsFinance = {
                accounts: [
                    { id: 'rawbank', name: 'Rawbank', displayName: 'Rawbank', currency: 'USD', isActive: true, color: 'bg-blue-500', icon: '🏦', order: 1 },
                    { id: 'equity', name: 'Equity', displayName: 'Equity BCDC', currency: 'USD', isActive: true, color: 'bg-purple-500', icon: '💳', order: 2 },
                    { id: 'paypal', name: 'PayPal', displayName: 'PayPal', currency: 'USD', isActive: true, color: 'bg-indigo-500', icon: '💙', order: 3 },
                    { id: 'mpesa', name: 'Mpesa', displayName: 'M-Pesa', currency: 'CDF', isActive: true, color: 'bg-emerald-500', icon: '📱', order: 4 },
                    { id: 'orangemoney', name: 'OrangeMoney', displayName: 'Orange Money', currency: 'CDF', isActive: true, color: 'bg-orange-500', icon: '🍊', order: 5 },
                    { id: 'cash', name: 'Cash', displayName: 'Cash / Caisse', currency: 'CDF', isActive: true, color: 'bg-slate-500', icon: '💵', order: 6 }
                ],
                defaultCurrency: 'CDF',
                defaultAccount: 'cash'
            };

            // Default Roles and Functions
            const defaultRoles: AppSettingsRolesAndFunctions = {
                churchRoles: [
                    { id: 'pasteur', label: 'Pasteur', isActive: true, order: 1 },
                    { id: 'pasteure', label: 'Pasteure', isActive: true, order: 2 },
                    { id: 'berger', label: 'Berger', isActive: true, order: 3 },
                    { id: 'bergere', label: 'Bergère', isActive: true, order: 4 },
                    { id: 'frere', label: 'Frère', isActive: true, order: 5 },
                    { id: 'soeur', label: 'Sœur', isActive: true, order: 6 },
                    { id: 'vice-president', label: 'Vice-président', isActive: true, order: 7 },
                    { id: 'admin', label: 'Admin', isActive: true, order: 8 },
                    { id: 'admin-adjoint', label: 'Admin adjoint', isActive: true, order: 9 },
                    { id: 'secretaire', label: 'Secrétaire', isActive: true, order: 10 },
                    { id: 'serviteur', label: 'Serviteur', isActive: true, order: 11 },
                    { id: 'fidele', label: 'Fidèle', isActive: true, order: 12 }
                ],
                churchFunctions: [
                    { id: 'pasteur-principal', label: 'Pasteur principal', isActive: true, order: 1 },
                    { id: 'pasteur-resident', label: 'Pasteur résident', isActive: true, order: 2 },
                    { id: 'pasteur-resident-adjoint', label: 'Pasteur résident adjoint', isActive: true, order: 3 },
                    { id: 'pasteur', label: 'Pasteur', isActive: true, order: 4 },
                    { id: 'berger', label: 'Berger', isActive: true, order: 5 },
                    { id: 'administrateur-principal', label: 'Administrateur principal', isActive: true, order: 6 },
                    { id: 'administrateur-adjoint', label: 'Administrateur adjoint', isActive: true, order: 7 },
                    { id: 'administrateur', label: 'Administrateur', isActive: true, order: 8 },
                    { id: 'president-departement', label: 'Président de département', isActive: true, order: 9 },
                    { id: 'vice-president-departement', label: 'Vice président de département', isActive: true, order: 10 },
                    { id: 'serviteur', label: 'Serviteur', isActive: true, order: 11 },
                    { id: 'aucune', label: 'Aucune', isActive: true, order: 12 }
                ]
            };

            // Default Programme Settings
            const defaultProgramme: AppSettingsProgramme = {
                defaultWeeklyServices: [
                    { dayOfWeek: 'Mercredi', serviceName: 'Culte', startTime: '16:30', endTime: '18:30', location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David', description: 'Enseignement et prière', order: 1 },
                    { dayOfWeek: 'Vendredi', serviceName: 'Culte', startTime: '16:30', endTime: '18:30', location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David', description: 'Enseignement et prière', order: 1 },
                    { dayOfWeek: 'Dimanche', serviceName: '1er culte', startTime: '07:20', endTime: '09:20', location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David', description: 'Culte de louange et adoration', order: 1 },
                    { dayOfWeek: 'Dimanche', serviceName: '2ème culte', startTime: '09:30', endTime: '11:30', location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David', description: 'Culte de louange et adoration', order: 2 },
                    { dayOfWeek: 'Dimanche', serviceName: '3ème culte', startTime: '16:00', endTime: '18:00', location: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David', description: 'Culte de louange et adoration', order: 3 }
                ],
                defaultLocation: 'Paroisse La Pentecôte C.E. Nouvelle Cité de David'
            };

            // Default AI Settings
            const defaultAI: AppSettingsAI = {
                tone: 'Pastoral',
                formality: 'Soutenu',
                systemPrompt: 'Tu es un assistant administratif chrétien expert. Tes réponses doivent être concises, respectueuses et bibliquement alignées si nécessaire.'
            };

            // Set all defaults (only if they don't exist)
            const [generalDoc, financeDoc, rolesDoc, programmeDoc, aiDoc] = await Promise.all([
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.GENERAL)),
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.FINANCE)),
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.ROLES_AND_FUNCTIONS)),
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.PROGRAMME)),
                getDoc(doc(db, COLLECTION_NAME, DOC_IDS.AI))
            ]);

            if (!generalDoc.exists()) {
                await setDoc(doc(db, COLLECTION_NAME, DOC_IDS.GENERAL), defaultGeneral);
            }
            if (!financeDoc.exists()) {
                await setDoc(doc(db, COLLECTION_NAME, DOC_IDS.FINANCE), defaultFinance);
            }
            if (!rolesDoc.exists()) {
                await setDoc(doc(db, COLLECTION_NAME, DOC_IDS.ROLES_AND_FUNCTIONS), defaultRoles);
            }
            if (!programmeDoc.exists()) {
                await setDoc(doc(db, COLLECTION_NAME, DOC_IDS.PROGRAMME), defaultProgramme);
            }
            if (!aiDoc.exists()) {
                await setDoc(doc(db, COLLECTION_NAME, DOC_IDS.AI), defaultAI);
            }

            console.log('✅ App settings initialized with defaults');
        } catch (error) {
            console.error("Error initializing app settings:", error);
            throw error;
        }
    }
};
