import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../types';

/**
 * Bootstrap utility to ensure the super admin user has the correct role in Firestore.
 * This should be run after the super admin first authenticates.
 * 
 * @returns true if role was updated, false if already correct
 */
export async function ensureSuperAdminExists(): Promise<boolean> {
    const SUPER_ADMIN_EMAIL = 'admin@ncd.com';
    const currentUser = auth.currentUser;

    if (!currentUser) {
        console.warn('⚠️ No user logged in. Cannot bootstrap super admin.');
        return false;
    }

    if (currentUser.email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        console.warn(`⚠️ Current user (${currentUser.email}) is not the super admin. Can only bootstrap ${SUPER_ADMIN_EMAIL}.`);
        return false;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);

    const currentData = userDoc.exists() ? userDoc.data() : null;

    // Check if update is needed
    if (currentData?.role === 'SUPER_ADMIN') {
        console.log('✅ Super admin role already correct for', SUPER_ADMIN_EMAIL);
        return false;
    }

    // Update or create profile with SUPER_ADMIN role
    const superAdminProfile: any = {
        id: currentUser.uid,
        email: SUPER_ADMIN_EMAIL,
        name: currentData?.name || 'Apostle Jean-Clément Diambilay',
        role: 'SUPER_ADMIN',
        updatedAt: new Date().toISOString()
    };

    // Preserve createdAt if it exists
    if (currentData?.createdAt) {
        superAdminProfile.createdAt = currentData.createdAt;
    } else {
        superAdminProfile.createdAt = new Date().toISOString();
    }

    await setDoc(userRef, superAdminProfile, { merge: true });

    // ✅ FIX: VERIFY the write succeeded by reading back
    const verifyDoc = await getDoc(userRef);
    const verifiedRole = verifyDoc.data()?.role;

    if (verifiedRole === 'SUPER_ADMIN') {
        console.log('✅ Super admin role successfully set and VERIFIED for', SUPER_ADMIN_EMAIL);
        return true;
    } else {
        console.error('❌ VERIFICATION FAILED: Role is', verifiedRole, 'instead of SUPER_ADMIN');
        throw new Error(`Failed to set SUPER_ADMIN role - verification failed. Current role: ${verifiedRole}`);
    }
}

/**
 * Check if the currently logged-in user should be super admin based on email.
 * This is a helper for conditional UI elements (e.g., showing a bootstrap button).
 */
export function isCurrentUserSuperAdminEmail(): boolean {
    const SUPER_ADMIN_EMAIL = 'admin@ncd.com';
    const currentUser = auth.currentUser;
    return currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}
