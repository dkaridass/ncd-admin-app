# 🧪 RBAC & User Management Testing Guide

## Overview

This guide covers testing the **Gestion des Utilisateurs (Users & Roles)** system, ensuring role-based access control works correctly across all modules.

---

## 🔧 Setup

### 1. **Run the Application**

```bash
npm run dev
```

### 2. **Login as SUPER_ADMIN**

- Email: `admin@ncd.com`
- Password: (your Firebase Auth password)

---

## 📋 Test Checklist

### **Test 1: Verify SUPER_ADMIN Auto-Assignment**

**Steps:**
1. Log in with `admin@ncd.com`
2. Check browser console for: `✅ Created user profile for admin@ncd.com with role: SUPER_ADMIN (verified)`
3. Navigate to `/users` page

**Verify:**
- [ ] Your account appears in the list
- [ ] Role shows as "Pasteur Principal" (SUPER_ADMIN)
- [ ] Status shows as "Actif"
- [ ] You can see all users in the system

---

### **Test 2: View Users List**

**Steps:**
1. Navigate to `/users` page
2. Check stats cards at the top

**Verify:**
- [ ] Stats cards show: Total, Actifs, Inactifs, Admins, Pasteurs
- [ ] User table displays all users
- [ ] Each user shows: Name, Email, Role, Status, Created date
- [ ] Your own account is marked with "(Vous)"

---

### **Test 3: Search & Filter Users**

**Steps:**
1. Type a name or email in the search box
2. Select a role from the role filter dropdown
3. Select a status from the status filter dropdown

**Verify:**
- [ ] Search filters users by name or email
- [ ] Role filter shows only users with selected role
- [ ] Status filter shows only active or inactive users
- [ ] Filters work together (AND logic)

---

### **Test 4: Change User Role**

**Steps:**
1. Find a user in the list (not yourself)
2. Click on the role dropdown for that user
3. Select a different role (e.g., change VIEWER to MEMBER)
4. Confirm the change

**Verify:**
- [ ] Success toast appears: "✅ Rôle de [Name] mis à jour: [New Role]"
- [ ] Role dropdown updates immediately
- [ ] User's role changes in Firestore (check Firebase Console)
- [ ] If you change to SUPER_ADMIN, confirmation dialog appears

**Test Self-Protection:**
5. Try to change your own role from SUPER_ADMIN to another role

**Verify:**
- [ ] Dropdown is disabled for your own account
- [ ] Cannot change your own SUPER_ADMIN role

---

### **Test 5: Activate/Deactivate User**

**Steps:**
1. Find a user in the list (not yourself)
2. Click the status button (Actif/Inactif)
3. Confirm the change

**Verify:**
- [ ] Success toast appears: "✅ Compte de [Name] activé/désactivé"
- [ ] Status button updates immediately
- [ ] User's `isActive` field updates in Firestore
- [ ] Inactive users appear dimmed in the list

**Test Self-Protection:**
4. Try to deactivate your own account

**Verify:**
- [ ] Status button is disabled for your own account
- [ ] Cannot deactivate your own account

---

### **Test 6: Test Role Access - PASTOR**

**Steps:**
1. Create a test user or change an existing user's role to PASTOR
2. Log out
3. Log in as the PASTOR user

**Verify Access:**
- [ ] ✅ Can view Dashboard
- [ ] ✅ Can view Members (all)
- [ ] ✅ Can view Departments (all)
- [ ] ✅ Can view Programme (all)
- [ ] ✅ Can view Announcements (all)
- [ ] ✅ Can view Resources (all)
- [ ] ✅ Can view Volunteers
- [ ] ✅ Can view Prayer Requests (including private)
- [ ] ✅ Can create/edit Members
- [ ] ✅ Can create/edit Departments
- [ ] ✅ Can create/edit Programme
- [ ] ✅ Can create/edit Announcements
- [ ] ❌ Cannot access Finance (should not see `/finances` route or see finance widgets)
- [ ] ❌ Cannot edit Resources
- [ ] ❌ Cannot access Users page (`/users` should show "Accès refusé" or redirect)

---

### **Test 7: Test Role Access - FINANCE_ADMIN**

**Steps:**
1. Change a user's role to FINANCE_ADMIN
2. Log out
3. Log in as the FINANCE_ADMIN user

**Verify Access:**
- [ ] ✅ Can view Dashboard (finance widgets visible)
- [ ] ✅ Can view Finance (full CRUD)
- [ ] ✅ Can view Members (read-only)
- [ ] ✅ Can view Departments (read-only)
- [ ] ✅ Can view Programme (read-only)
- [ ] ✅ Can view Announcements (read-only)
- [ ] ✅ Can view Resources (read-only)
- [ ] ✅ Can view Volunteers
- [ ] ✅ Can view public Prayer Requests
- [ ] ❌ Cannot edit Members
- [ ] ❌ Cannot edit Departments
- [ ] ❌ Cannot edit Programme
- [ ] ❌ Cannot edit Announcements
- [ ] ❌ Cannot edit Resources
- [ ] ❌ Cannot view private Prayer Requests
- [ ] ❌ Cannot access Users page

---

### **Test 8: Test Role Access - STAFF_ADMIN**

**Steps:**
1. Change a user's role to STAFF_ADMIN
2. Log out
3. Log in as the STAFF_ADMIN user

**Verify Access:**
- [ ] ✅ Can view Dashboard
- [ ] ✅ Can view/edit Members (full CRUD)
- [ ] ✅ Can view/edit Departments (full CRUD)
- [ ] ✅ Can view/edit Programme (full CRUD)
- [ ] ✅ Can view/edit Announcements (full CRUD)
- [ ] ✅ Can view/edit Resources (full CRUD)
- [ ] ✅ Can create Finance records (offerings)
- [ ] ✅ Can view public Prayer Requests
- [ ] ❌ Cannot edit/delete Finance records (only create)
- [ ] ❌ Cannot view private Prayer Requests
- [ ] ❌ Cannot access Users page

---

### **Test 9: Test Role Access - DEPT_LEADER**

**Steps:**
1. Change a user's role to DEPT_LEADER
2. Assign them to a department (via Members page)
3. Log out
4. Log in as the DEPT_LEADER user

**Verify Access:**
- [ ] ✅ Can view Dashboard (limited widgets)
- [ ] ✅ Can view all Members
- [ ] ✅ Can edit Members in their department only
- [ ] ✅ Can view all Departments
- [ ] ✅ Can view/edit their own Department
- [ ] ✅ Can view Programme (read-only)
- [ ] ✅ Can view Announcements (read-only)
- [ ] ✅ Can view Resources (read-only)
- [ ] ✅ Can view Volunteers in their department
- [ ] ✅ Can view public Prayer Requests
- [ ] ❌ Cannot create/edit Departments (except own)
- [ ] ❌ Cannot access Finance
- [ ] ❌ Cannot edit Programme, Announcements, Resources
- [ ] ❌ Cannot view private Prayer Requests
- [ ] ❌ Cannot access Users page

---

### **Test 10: Test Role Access - MEMBER**

**Steps:**
1. Change a user's role to MEMBER
2. Log out
3. Log in as the MEMBER user

**Verify Access:**
- [ ] ✅ Can view Dashboard (read-only)
- [ ] ✅ Can view own profile only
- [ ] ✅ Can edit own profile
- [ ] ✅ Can view Departments (read-only)
- [ ] ✅ Can view Programme (read-only)
- [ ] ✅ Can view Announcements (read-only)
- [ ] ✅ Can view Resources (read-only)
- [ ] ✅ Can view Volunteers
- [ ] ✅ Can view public Prayer Requests + own private requests
- [ ] ✅ Can create Prayer Requests
- [ ] ✅ Can update/delete own Prayer Requests
- [ ] ❌ Cannot view other Members
- [ ] ❌ Cannot access Finance
- [ ] ❌ Cannot edit Departments, Programme, Announcements, Resources
- [ ] ❌ Cannot access Users page

---

### **Test 11: Test Role Access - VIEWER**

**Steps:**
1. Change a user's role to VIEWER
2. Log out
3. Log in as the VIEWER user

**Verify Access:**
- [ ] ✅ Can view Dashboard (read-only)
- [ ] ✅ Can view Departments (read-only)
- [ ] ✅ Can view Programme (read-only)
- [ ] ✅ Can view Announcements (read-only)
- [ ] ✅ Can view Resources (read-only)
- [ ] ✅ Can view public Prayer Requests
- [ ] ✅ Can create Prayer Requests
- [ ] ❌ Cannot view Members
- [ ] ❌ Cannot access Finance
- [ ] ❌ Cannot edit anything
- [ ] ❌ Cannot access Users page

---

### **Test 12: Real-Time Role Updates**

**Steps:**
1. Open the app in two browser windows (or tabs)
2. In Window 1: Log in as SUPER_ADMIN
3. In Window 2: Log in as a test user (e.g., VIEWER)
4. In Window 1: Change the test user's role to MEMBER
5. In Window 2: Refresh the page (or wait for real-time update)

**Verify:**
- [ ] User's role updates in Window 2 automatically (if real-time listener is working)
- [ ] Or user's role updates after page refresh
- [ ] User's permissions change immediately (e.g., can now view own profile)

---

### **Test 13: Permission Checks in UI**

**Steps:**
1. Log in as different roles (PASTOR, FINANCE_ADMIN, MEMBER, VIEWER)
2. Navigate through the app

**Verify:**
- [ ] Buttons/actions that require permissions are hidden (not just disabled)
- [ ] Protected routes show "Accès refusé" or redirect appropriately
- [ ] Dashboard widgets respect permissions (finance widgets only for finance roles)
- [ ] Navigation menu items are hidden for unauthorized roles

---

### **Test 14: Firestore Security Rules**

**Steps:**
1. Log in as a non-admin user (e.g., MEMBER)
2. Open browser console
3. Try to access Firestore directly (if possible) or check network requests

**Verify:**
- [ ] User can only read collections they have permission for
- [ ] User cannot write to collections they don't have permission for
- [ ] Firestore rules enforce role-based access

**Note:** This requires checking Firebase Console or using Firebase Admin SDK to verify rules are working.

---

### **Test 15: User Status (Active/Inactive)**

**Steps:**
1. Log in as SUPER_ADMIN
2. Deactivate a user account
3. Log out
4. Try to log in as the deactivated user

**Verify:**
- [ ] Deactivated user cannot log in (if login check is implemented)
- [ ] Or deactivated user can log in but sees limited access
- [ ] Inactive users appear dimmed in Users list
- [ ] Status filter works correctly

**Note:** Currently, `isActive` is stored but may not be checked during login. This is a future enhancement.

---

## ✅ Complete Test Checklist

- [ ] SUPER_ADMIN auto-assignment works
- [ ] Users list displays correctly
- [ ] Search and filters work
- [ ] Role changes work and reflect immediately
- [ ] Status toggle works
- [ ] Self-protection (cannot change own role/status)
- [ ] PASTOR role access is correct
- [ ] FINANCE_ADMIN role access is correct
- [ ] STAFF_ADMIN role access is correct
- [ ] DEPT_LEADER role access is correct
- [ ] MEMBER role access is correct
- [ ] VIEWER role access is correct
- [ ] Real-time role updates work
- [ ] Permission checks in UI work
- [ ] Firestore security rules enforce access
- [ ] User status (active/inactive) works

---

## 🐛 Troubleshooting

### **Issue: Role changes not reflecting**

**Solution:**
- Check browser console for errors
- Verify Firestore security rules allow SUPER_ADMIN to write to `/users` collection
- Check that real-time listener is active in DataContext

### **Issue: Cannot access Users page**

**Solution:**
- Verify you are logged in as SUPER_ADMIN
- Check that `hasPermission('MANAGE_ROLES')` returns true
- Verify Firestore rules allow read access to `/users` collection

### **Issue: Permission checks not working**

**Solution:**
- Check that `hasPermission()` function in DataContext is working
- Verify `ROLE_PERMISSIONS` mapping includes the permission
- Check that `PermissionGuard` component is used correctly

---

## 📝 Notes

- **Role Storage:** Roles are stored in Firestore `/users/{uid}.role` field
- **Real-Time Updates:** Role changes reflect immediately via `onSnapshot` listener
- **Self-Protection:** SUPER_ADMIN cannot change their own role or deactivate their account
- **Default Role:** New users default to VIEWER role (except admin@ncd.com)
- **Status Field:** `isActive` field exists but may not be checked during login yet (future enhancement)

---

**Last Updated:** 2024-01-XX  
**Status:** ✅ Complete & Ready for Testing
