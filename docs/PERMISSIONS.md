# 🔐 NCD Admin App - Permissions & RBAC Documentation

## Overview

This document defines the **single source of truth** for Role-Based Access Control (RBAC) in the NCD Admin App.

## ⚠️ Critical Understanding

**Firestore Security Rules are the ONLY real enforcement layer.**

- **Frontend checks** (`PermissionGuard`, `hasPermission()`) = **UI hints only**
- **Firestore Rules** = **Actual security enforcement**

Never rely on frontend checks for security. They exist only to improve UX by hiding unavailable features.

---

## Role Hierarchy

From highest to lowest privilege:

1. **SUPER_ADMIN** - Full system access (Apostle/Senior Pastor)
2. **PASTOR** - Pastoral care, member management, announcements
3. **STAFF_ADMIN** - Day-to-day operations, member editing
4. **FINANCE_ADMIN** - Financial records only
5. **DEPT_LEADER** - Department-specific access
6. **VOLUNTEER** - Limited pastoral care view
7. **MEMBER** - Basic pastoral care view
8. **VIEWER** - Read-only access (default for new users)

---

## Permission Matrix

### SUPER_ADMIN Permissions

**Full Access to Everything:**
- ✅ VIEW_MEMBERS, EDIT_MEMBERS, DELETE_MEMBERS
- ✅ VIEW_FINANCES, CREATE_FINANCES, EDIT_FINANCES, DELETE_FINANCES
- ✅ VIEW_PASTORAL_CARE, VIEW_PRIVATE_PRAYERS
- ✅ MANAGE_DEPARTMENTS, MANAGE_SETTINGS, ACCESS_AI_CONFIG
- ✅ MANAGE_TASKS, MANAGE_ANNOUNCEMENTS, MANAGE_RESOURCES
- ✅ MANAGE_ROLES (change other users' roles)
- ✅ SEND_MESSAGES, MANAGE_TEMPLATES

**Special:** Only SUPER_ADMIN can change user roles.

### PASTOR Permissions

**Pastoral & Leadership:**
- ✅ VIEW_MEMBERS
- ✅ VIEW_PASTORAL_CARE, VIEW_PRIVATE_PRAYERS
- ✅ MANAGE_DEPARTMENTS, MANAGE_ANNOUNCEMENTS
- ✅ SEND_MESSAGES, MANAGE_TEMPLATES

### STAFF_ADMIN Permissions

**Operations & Member Management:**
- ✅ VIEW_MEMBERS, EDIT_MEMBERS
- ✅ CREATE_FINANCES (can record offerings)
- ✅ VIEW_PASTORAL_CARE
- ✅ MANAGE_DEPARTMENTS, MANAGE_TASKS
- ✅ MANAGE_ANNOUNCEMENTS, MANAGE_RESOURCES
- ✅ SEND_MESSAGES

### FINANCE_ADMIN Permissions

**Finance Only:**
- ✅ VIEW_FINANCES, CREATE_FINANCES, EDIT_FINANCES

### DEPT_LEADER Permissions

**Department Specific:**
- ✅ VIEW_PASTORAL_CARE
- ✅ MANAGE_TASKS (for their department)

### VOLUNTEER & MEMBER Permissions

**Limited View:**
- ✅ VIEW_PASTORAL_CARE

### VIEWER Permissions

**None** - Default role for new users until promoted.

---

## Implementation Layers

### Layer 1: Firestore Security Rules (ENFORCEMENT)

**Location:** [`firestore.rules`](file:///Users/Apple/Downloads/ncd-la-pentecôte-admin/firestore.rules)

**Purpose:** **Actual security enforcement** - blocks unauthorized database operations.

**Example:**
```rules
match /members/{memberId} {
  allow read: if isAuthenticated();
  allow write: if isSuperAdmin() || isPastor() || isStaffAdmin();
}
```

**Key Functions:**
- `isSuperAdmin()` - Checks if user role is SUPER_ADMIN
- `isAuthenticated()` - Checks if user is logged in
- `getUserData()` - Fetches user document to check role

### Layer 2: Frontend Permission Checks (UX HINTS)

**Location:** [`context/DataContext.tsx`](file:///Users/Apple/Downloads/ncd-la-pentecôte-admin/context/DataContext.tsx#L17-L33)

**Purpose:** Define which permissions each role has for **UI visibility**.

**Example:**
```typescript
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  SUPER_ADMIN: ['VIEW_MEMBERS', 'EDIT_MEMBERS', 'DELETE_MEMBERS', ...],
  PASTOR: ['VIEW_MEMBERS', 'VIEW_PASTORAL_CARE', ...],
  // ...
}
```

**Usage:**
```typescript
const { hasPermission } = useData();

if (hasPermission('DELETE_MEMBERS')) {
  // Show delete button
}
```

### Layer 3: Permission Guard Component (UI WRAPPER)

**Location:** [`components/auth/PermissionGuard.tsx`](file:///Users/Apple/Downloads/ncd-la-pentecôte-admin/components/auth/PermissionGuard.tsx)

**Purpose:** Conditionally render UI elements based on permissions.

**Example:**
```tsx
<PermissionGuard permission="EDIT_MEMBERS">
  <Button>Edit Member</Button>
</PermissionGuard>
```

---

## How Roles Are Assigned

### Automatic Assignment

**SUPER_ADMIN:**
- Email: `admin@ncd.com`
- **Automatically assigned** during login/registration
- No manual activation needed (as of Stabilization Phase 1)

**All Other Users:**
- Default role: `VIEWER`
- Must be promoted by SUPER_ADMIN via Users page

### Manual Role Changes

**Who Can Change Roles:**
- Only SUPER_ADMIN (via `MANAGE_ROLES` permission)

**How to Change:**
1. Log in as SUPER_ADMIN
2. Go to **Users** page
3. Click on user card
4. Select new role from dropdown
5. Changes apply **immediately** (real-time listener updates UI)

**Restrictions:**
- SUPER_ADMIN cannot remove their own SUPER_ADMIN role
- Firestore rules prevent non-admins from changing roles

---

## Role Storage & Retrieval

### Where Roles Are Stored

**Firestore Collection:** `/users/{userId}`

**Document Structure:**
```json
{
  "id": "firebase-uid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "SUPER_ADMIN",
  "createdAt": "2026-01-24T00:00:00.000Z",
  "updatedAt": "2026-01-24T00:00:00.000Z"
}
```

### How Roles Are Retrieved

**Real-Time Listener** (as of Stabilization Phase 2):

```typescript
// DataContext.tsx - Line 114+
onAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    const userRef = doc(db, 'users', firebaseUser.uid);
    onSnapshot(userRef, (docSnap) => {
      const profile = { id: firebaseUser.uid, ...docSnap.data() } as User;
      setCurrentUser(profile); // Role updates instantly!
    });
  }
});
```

**Benefits:**
- Role changes appear **instantly** without page refresh
- No race conditions
- Always in sync with Firestore

---

## Common Permission Scenarios

### Scenario 1: Adding a New Permission

1. **Define the permission** in `types.ts`:
   ```typescript
   export type Permission = 
     | 'VIEW_MEMBERS'
     | 'MY_NEW_PERMISSION' // Add here
     | ...
   ```

2. **Assign to roles** in `DataContext.tsx`:
   ```typescript
   SUPER_ADMIN: ['VIEW_MEMBERS', 'MY_NEW_PERMISSION', ...],
   PASTOR: ['MY_NEW_PERMISSION', ...], // If pastors should have it
   ```

3. **Enforce in Firestore rules** (if database operation):
   ```rules
   match /myCollection/{docId} {
     allow write: if isSuperAdmin() || isPastor();
   }
   ```

4. **Use in UI**:
   ```tsx
   <PermissionGuard permission="MY_NEW_PERMISSION">
     <MyFeature />
   </PermissionGuard>
   ```

### Scenario 2: Debugging "Permission Denied" Errors

**Error:** `FirebaseError: Missing or insufficient permissions`

**Diagnosis Steps:**

1. **Check browser console** for current user role:
   ```
   👤 User profile updated: { email: "...", role: "VIEWER" }
   ```

2. **Verify Firestore rules** allow the operation:
   - Open `firestore.rules`
   - Find the collection rule
   - Check if your role is allowed

3. **Deploy rules** if you made changes:
   ```bash
   npx firebase-tools deploy --only firestore:rules --project ncd-admin-app
   ```

4. **Check if user document exists** in Firestore Console:
   - https://console.firebase.google.com/project/ncd-admin-app/firestore
   - Navigate to `users` collection
   - Find your UID
   - Verify `role` field

### Scenario 3: User Stuck as VIEWER

**Problem:** User should be SUPER_ADMIN but shows as VIEWER.

**Solution (as of Stabilization Phase 1):**

For `admin@ncd.com`:
- **Should auto-elevate** on next login
- If not, check console for errors during login
- Manually verify in Firestore that email matches exactly

For other users:
- SUPER_ADMIN must promote them via Users page
- Changes apply immediately (real-time listener)

---

## Security Best Practices

### ✅ DO

- **Always enforce permissions in Firestore rules** (backend)
- Use frontend checks only for UX (hiding buttons)
- Test permission changes in Firestore Console
- Deploy rule changes immediately after editing
- Log role changes for audit trail

### ❌ DON'T

- Rely on frontend checks for security
- Assume role changes persist without verification
- Mix mock data with real Firestore data
- Create custom permission logic outside this system
- Give SUPER_ADMIN to untrusted users

---

## Troubleshooting

### Issue: Role Changes Don't Appear

**Cause:** Old code used one-time reads (fixed in Phase 2)

**Solution:** Real-time listener now updates instantly. If still broken:
1. Check browser console for listener errors
2. Verify Firestore rules allow read access to `/users/{uid}`
3. Hard refresh browser (Cmd+Shift+R)

### Issue: SUPER_ADMIN Keeps Becoming VIEWER

**Cause:** Old code didn't auto-assign SUPER_ADMIN (fixed in Phase 1)

**Solution:** 
1. Log out completely
2. Delete user document from Firestore (optional)
3. Log in again as `admin@ncd.com`
4. Should auto-assign SUPER_ADMIN

### Issue: Permission Denied in Firestore

**Cause:** Firestore rules blocking operation

**Solution:**
1. Check `firestore.rules` for the collection
2. Verify your role is allowed
3. Deploy rules: `npx firebase-tools deploy --only firestore:rules`
4. Wait 30 seconds for rules to propagate

---

## Maintenance Checklist

### When Adding a New Role

- [ ] Add to `AppRole` type in `types.ts`
- [ ] Define permissions in `ROLE_PERMISSIONS` (DataContext.tsx)
- [ ] Update Firestore rules if needed
- [ ] Add to role display mappings (UsersPage.tsx, SettingsPage.tsx)
- [ ] Test with a real user account
- [ ] Document in this file

### When Adding a New Collection

- [ ] Define Firestore rules for the collection
- [ ] Specify which roles can read/write
- [ ] Deploy rules to Firebase
- [ ] Test with different role levels
- [ ] Update this documentation

### Monthly Security Audit

- [ ] Review Firestore rules for each collection
- [ ] Verify SUPER_ADMIN is only assigned to trusted users
- [ ] Check for any "allow write: if true" rules (security risk!)
- [ ] Test permission boundaries with test accounts
- [ ] Review audit logs for suspicious role changes

---

## Related Files

- [`types.ts`](file:///Users/Apple/Downloads/ncd-la-pentecôte-admin/types.ts) - Role and Permission type definitions
- [`context/DataContext.tsx`](file:///Users/Apple/Downloads/ncd-la-pentecôte-admin/context/DataContext.tsx) - ROLE_PERMISSIONS mapping
- [`firestore.rules`](file:///Users/Apple/Downloads/ncd-la-pentecôte-admin/firestore.rules) - Security enforcement
- [`services/authService.ts`](file:///Users/Apple/Downloads/ncd-la-pentecôte-admin/services/authService.ts) - Login/registration with auto-elevation
- [`components/auth/PermissionGuard.tsx`](file:///Users/Apple/Downloads/ncd-la-pentecôte-admin/components/auth/PermissionGuard.tsx) - UI wrapper component

---

**Last Updated:** 2026-01-24  
**Stabilization Phase:** 5 (Complete)  
**Maintained By:** Development Team
