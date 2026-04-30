import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';

export const authService = {
    /**
     * Authenticate user and fetch their profile from Firestore.
     * No special-case logic - database is the source of truth for roles.
     */
    login: async (email: string, password: string): Promise<User> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

            const SUPER_ADMIN_EMAIL = 'admin@ncd.com';
            const isSuperAdmin = userCredential.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

            if (userDoc.exists()) {
                const userData = userDoc.data();
                // ✅ FIX: If admin@ncd.com but role is not SUPER_ADMIN, fix it immediately
                if (isSuperAdmin && userData.role !== 'SUPER_ADMIN') {
                    console.warn(`⚠️ Admin email detected but role is ${userData.role}. Fixing to SUPER_ADMIN...`);
                    const fixedUser = {
                        ...userData,
                        role: 'SUPER_ADMIN',
                        updatedAt: new Date().toISOString()
                    };
                    await setDoc(doc(db, 'users', userCredential.user.uid), fixedUser, { merge: true });
                    // Verify the fix
                    const verifyDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                    const verifiedRole = verifyDoc.data()?.role;
                    if (verifiedRole === 'SUPER_ADMIN') {
                        console.log('✅ SUPER_ADMIN role fixed and verified');
                        return { id: userCredential.user.uid, ...fixedUser } as User;
                    } else {
                        console.error('❌ Failed to fix SUPER_ADMIN role');
                        throw new Error('Failed to set SUPER_ADMIN role - verification failed');
                    }
                }
                // User profile exists and role is correct - return it as-is
                return { id: userCredential.user.uid, ...userData } as User;
            } else {
                // User authenticated but no profile exists - create profile
                // ✅ FIX: Auto-assign SUPER_ADMIN to admin@ncd.com
                const newUser: User = {
                    id: userCredential.user.uid,
                    name: isSuperAdmin ? 'Apostle Jean-Clément Diambilay' : (userCredential.user.displayName || email.split('@')[0]),
                    role: isSuperAdmin ? 'SUPER_ADMIN' : 'VIEWER',
                    email: userCredential.user.email || email,
                    createdAt: new Date().toISOString(),
                    isActive: true
                } as any;

                await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
                // Verify the creation
                const verifyDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                const verifiedRole = verifyDoc.data()?.role;
                if (isSuperAdmin && verifiedRole !== 'SUPER_ADMIN') {
                    console.error('❌ Failed to create SUPER_ADMIN role');
                    throw new Error('Failed to set SUPER_ADMIN role - verification failed');
                }
                console.log(`✅ Created user profile for ${newUser.email} with role: ${newUser.role} (verified)`);
                return newUser;
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    },

    /**
     * Fetch user profile from Firestore.
     * Returns data as-is without any modifications.
     */
    getUserProfile: async (uid: string): Promise<User | null> => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return { id: uid, ...userDoc.data() } as User;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    },

    /**
     * Register a new user account.
     * New users are created with VIEWER role by default.
     * Super admin must manually promote users to higher roles.
     */
    register: async (email: string, password: string, name: string): Promise<User> => {
        try {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // ✅ FIX: Auto-assign SUPER_ADMIN to admin@ncd.com
            const SUPER_ADMIN_EMAIL = 'admin@ncd.com';
            const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

            const userData: User = {
                id: userCredential.user.uid,
                name: isSuperAdmin ? 'Apostle Jean-Clément Diambilay' : name,
                email: email,
                role: isSuperAdmin ? 'SUPER_ADMIN' : 'VIEWER', // Auto-assign SUPER_ADMIN to admin@ncd.com
                createdAt: new Date().toISOString(),
                isActive: true
            } as any;

            await setDoc(doc(db, 'users', userCredential.user.uid), userData);
            console.log(`✅ Registered user ${userData.email} with role: ${userData.role}`);
            return userData;
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    },

    /**
     * Send password reset email.
     */
    resetPassword: async (email: string): Promise<void> => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error("Reset password error:", error);
            throw error;
        }
    }
};

