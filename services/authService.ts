import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';

/**
 * The super-admin email is read from the environment variable VITE_SUPER_ADMIN_EMAIL.
 * This keeps it out of source code. Falls back to empty string (no auto-assignment).
 */
const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || '').toLowerCase().trim();

const isSuperAdminEmail = (email: string) =>
    SUPER_ADMIN_EMAIL !== '' && email.toLowerCase().trim() === SUPER_ADMIN_EMAIL;

export const authService = {
    /**
     * Authenticate user and fetch their profile from Firestore.
     * Firestore is the source of truth for roles.
     */
    login: async (email: string, password: string): Promise<User> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            const isSuper = isSuperAdminEmail(userCredential.user.email || '');

            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Auto-fix role if configured super-admin email logs in with wrong role
                if (isSuper && userData.role !== 'SUPER_ADMIN') {
                    console.warn(`⚠️ Super-admin email detected but role is ${userData.role}. Fixing...`);
                    const fixedUser = { ...userData, role: 'SUPER_ADMIN', updatedAt: new Date().toISOString() };
                    await setDoc(doc(db, 'users', userCredential.user.uid), fixedUser, { merge: true });
                    const verifyDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                    if (verifyDoc.data()?.role === 'SUPER_ADMIN') {
                        return { id: userCredential.user.uid, ...fixedUser } as User;
                    } else {
                        throw new Error('Failed to set SUPER_ADMIN role - verification failed');
                    }
                }
                return { id: userCredential.user.uid, ...userData } as User;
            } else {
                // No profile yet — create one
                const newUser: User = {
                    id: userCredential.user.uid,
                    name: userCredential.user.displayName || email.split('@')[0],
                    role: isSuper ? 'SUPER_ADMIN' : 'VIEWER',
                    email: userCredential.user.email || email,
                    createdAt: new Date().toISOString(),
                    isActive: true
                } as any;
                await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
                const verifyDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                if (isSuper && verifyDoc.data()?.role !== 'SUPER_ADMIN') {
                    throw new Error('Failed to set SUPER_ADMIN role - verification failed');
                }
                return newUser;
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    getUserProfile: async (uid: string): Promise<User | null> => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) return { id: uid, ...userDoc.data() } as User;
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },

    register: async (email: string, password: string, name: string): Promise<User> => {
        try {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const isSuper = isSuperAdminEmail(email);
            const userData: User = {
                id: userCredential.user.uid,
                name: name || email.split('@')[0],
                email: email,
                role: isSuper ? 'SUPER_ADMIN' : 'VIEWER',
                createdAt: new Date().toISOString(),
                isActive: true
            } as any;
            await setDoc(doc(db, 'users', userCredential.user.uid), userData);
            return userData;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    resetPassword: async (email: string): Promise<void> => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    }
};
