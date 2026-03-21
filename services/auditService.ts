
import { collection, addDoc, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type AuditAction =
    | 'CREATE_MEMBER'
    | 'IMPORT_MEMBERS'
    | 'UPDATE_MEMBER'
    | 'DELETE_MEMBER'
    | 'CREATE_FINANCE'
    | 'UPDATE_FINANCE'
    | 'DELETE_FINANCE'
    | 'APPROVE_FINANCE'
    | 'REVOKE_FINANCE'
    | 'CREATE_ATTENDANCE'
    | 'DELETE_ATTENDANCE'
    | 'CREATE_EVENT'
    | 'UPDATE_EVENT'
    | 'DELETE_EVENT'
    | 'CREATE_ANNOUNCEMENT'
    | 'UPDATE_ANNOUNCEMENT'
    | 'DELETE_ANNOUNCEMENT'
    | 'CREATE_DEPARTMENT'
    | 'UPDATE_DEPARTMENT'
    | 'DELETE_DEPARTMENT'
    | 'SUBMIT_REPORT'
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE_SERMON'
    | 'DELETE_SERMON'
    | 'CREATE_BRIEFING'
    | 'DELETE_BRIEFING'
    | 'REJECT_FINANCE'
    | 'ASSIGN_DEPARTMENT'
    | 'UPDATE_USER_STATUS'
    | 'DELETE_USER'
    | 'UPDATE_USER';

export interface AuditEntry {
    id?: string;
    action: AuditAction;
    userId: string;
    userName: string;
    userRole?: string;
    targetType: string; // 'member', 'finance', 'attendance', etc.
    targetId?: string;
    targetLabel?: string; // e.g. member name, finance amount
    details?: string;
    timestamp: string;
    createdAt?: any; // Firestore Timestamp
}

const AUDIT_COLLECTION = 'activityLog';

export const auditService = {
    async log(entry: Omit<AuditEntry, 'id' | 'timestamp' | 'createdAt'>): Promise<void> {
        try {
            await addDoc(collection(db, AUDIT_COLLECTION), {
                ...entry,
                timestamp: new Date().toISOString(),
                createdAt: Timestamp.now(),
            });
        } catch (error) {
            console.warn('Audit log failed (non-blocking):', error);
            // Audit logging should never block the main operation
        }
    },

    subscribe(
        limitCount: number,
        callback: (entries: AuditEntry[]) => void
    ): () => void {
        const q = query(
            collection(db, AUDIT_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        return onSnapshot(q, (snapshot) => {
            const entries: AuditEntry[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as AuditEntry));
            callback(entries);
        }, (error) => {
            console.warn('Audit subscription error:', error);
            callback([]);
        });
    },
};

// Helper to get action display info
export function getActionInfo(action: AuditAction): { icon: string; label: string; color: string } {
    const map: Record<AuditAction, { icon: string; label: string; color: string }> = {
        CREATE_MEMBER: { icon: '👤', label: 'Membre ajouté', color: 'emerald' },
        IMPORT_MEMBERS: { icon: '👥', label: 'Importation massive', color: 'emerald' },
        UPDATE_MEMBER: { icon: '✏️', label: 'Membre modifié', color: 'blue' },
        DELETE_MEMBER: { icon: '🗑️', label: 'Membre supprimé', color: 'red' },
        CREATE_FINANCE: { icon: '💰', label: 'Opération créée', color: 'emerald' },
        UPDATE_FINANCE: { icon: '💳', label: 'Opération modifiée', color: 'blue' },
        DELETE_FINANCE: { icon: '🗑️', label: 'Opération supprimée', color: 'red' },
        APPROVE_FINANCE: { icon: '✅', label: 'Opération approuvée', color: 'emerald' },
        REVOKE_FINANCE: { icon: '⏳', label: 'Approbation retirée', color: 'amber' },
        CREATE_ATTENDANCE: { icon: '📋', label: 'Présences enregistrées', color: 'emerald' },
        DELETE_ATTENDANCE: { icon: '🗑️', label: 'Présences supprimées', color: 'red' },
        CREATE_EVENT: { icon: '📅', label: 'Événement créé', color: 'indigo' },
        UPDATE_EVENT: { icon: '📅', label: 'Événement modifié', color: 'blue' },
        DELETE_EVENT: { icon: '🗑️', label: 'Événement supprimé', color: 'red' },
        CREATE_ANNOUNCEMENT: { icon: '📢', label: 'Annonce publiée', color: 'purple' },
        UPDATE_ANNOUNCEMENT: { icon: '📢', label: 'Annonce modifiée', color: 'blue' },
        DELETE_ANNOUNCEMENT: { icon: '🗑️', label: 'Annonce supprimée', color: 'red' },
        CREATE_DEPARTMENT: { icon: '🏛️', label: 'Département créé', color: 'indigo' },
        UPDATE_DEPARTMENT: { icon: '🏛️', label: 'Département modifié', color: 'blue' },
        DELETE_DEPARTMENT: { icon: '🗑️', label: 'Département supprimé', color: 'red' },
        SUBMIT_REPORT: { icon: '📄', label: 'Rapport soumis', color: 'purple' },
        LOGIN: { icon: '🔑', label: 'Connexion', color: 'slate' },
        LOGOUT: { icon: '🚪', label: 'Déconnexion', color: 'slate' },
        CREATE_SERMON: { icon: '📖', label: 'Plan de sermon généré', color: 'indigo' },
        DELETE_SERMON: { icon: '🗑️', label: 'Plan de sermon supprimé', color: 'red' },
        CREATE_BRIEFING: { icon: '📋', label: 'Briefing créé', color: 'indigo' },
        DELETE_BRIEFING: { icon: '🗑️', label: 'Briefing supprimé', color: 'red' },
        REJECT_FINANCE: { icon: '❌', label: 'Opération rejetée', color: 'red' },
        ASSIGN_DEPARTMENT: { icon: '🏢', label: 'Département assigné', color: 'indigo' },
        UPDATE_USER_STATUS: { icon: '🔐', label: 'Statut utilisateur changé', color: 'amber' },
        DELETE_USER: { icon: '🗑️', label: 'Utilisateur supprimé', color: 'red' },
        UPDATE_USER: { icon: '👤', label: 'Profil utilisateur modifié', color: 'blue' },
    };
    return map[action] || { icon: '📝', label: action, color: 'slate' };
}
