# 🧪 NCD Admin App - Testing Guide

**Version:** Stabilization Phase Complete  
**Date:** 2026-01-24  
**Purpose:** Comprehensive testing guide for admin@ncd.com and all core modules

---

## Prerequisites

### Environment Setup

1. **Firebase Configuration**
   - Ensure `.env` file exists with:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

2. **Firebase Console Access**
   - Access Firestore Console: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore
   - Access Authentication Console: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication

3. **Run the App**
   ```bash
   npm install
   npm run dev
   ```
   - App should start on `http://localhost:5173` (or port shown in terminal)

---

## Test 1: SUPER_ADMIN Authentication & Role Verification

### Objective
Verify that `admin@ncd.com` correctly receives and maintains SUPER_ADMIN role.

### Steps

1. **Initial Login**
   - Navigate to login page
   - Enter email: `admin@ncd.com`
   - Enter password (your Firebase Auth password)
   - Click "Se connecter"

2. **Verify Role Assignment**
   - Open browser DevTools Console (F12)
   - Look for log: `✅ Created user profile for admin@ncd.com with role: SUPER_ADMIN (verified)`
   - OR if profile exists: `✅ SUPER_ADMIN role fixed and verified`

3. **Check Firestore**
   - Open Firestore Console
   - Navigate to `/users` collection
   - Find document with email `admin@ncd.com`
   - Verify `role` field is `SUPER_ADMIN`

4. **Verify UI Access**
   - Dashboard should load without permission errors
   - All navigation items should be visible
   - No "Access Restricted" messages

5. **Test Role Persistence**
   - Refresh page (F5)
   - Check console for: `👤 User profile updated: { email: "admin@ncd.com", role: "SUPER_ADMIN" }`
   - Verify role remains SUPER_ADMIN after refresh

### Expected Results
- ✅ Login succeeds
- ✅ Role is set to SUPER_ADMIN in Firestore
- ✅ All modules accessible
- ✅ Role persists after refresh
- ✅ Real-time listener updates role instantly

### Troubleshooting

**Issue:** Role shows as VIEWER
- **Solution:** Click "Activer SUPER_ADMIN Maintenant" button on Dashboard (if visible)
- **Or:** Manually set role in Firestore Console: `/users/{uid}` → `role: "SUPER_ADMIN"`

**Issue:** Permission denied errors
- **Check:** Firestore rules are deployed: `npx firebase deploy --only firestore:rules`
- **Check:** User document exists in `/users` collection

---

## Test 2: Members Module - CRUD Operations

### Objective
Verify Members CRUD operations sync correctly with Firestore and update UI in real-time.

### Steps

#### **2.1 Create Member**

1. Navigate to **Members** page (`/members`)
2. Click **"Nouveau"** button (top right)
3. Fill in form:
   - Name: `Test Member`
   - Gender: `Homme`
   - Status: `Fidèle`
   - Phone: `+243900000000`
   - Birth Date: `1990-01-01`
4. Click **"Enregistrer le Profil"**

**Expected:**
- ✅ Member card appears immediately in grid
- ✅ No page refresh needed
- ✅ Firestore `/members` collection shows new document

**Verify in Firestore:**
- Open Firestore Console → `/members` collection
- Find document with `name: "Test Member"`
- Verify all fields are saved correctly

#### **2.2 Edit Member**

1. Click on the **Test Member** card
2. Change name to `Test Member Updated`
3. Change status to `Visiteur`
4. Click **"Enregistrer le Profil"**

**Expected:**
- ✅ Card updates immediately
- ✅ Changes visible without refresh
- ✅ Firestore document updated

**Verify in Firestore:**
- Check `/members/{memberId}` document
- Verify `name` and `status` fields updated

#### **2.3 Delete Member**

1. Click on **Test Member Updated** card
2. Scroll to bottom of drawer
3. Click **"Supprimer le Membre"** button
4. Confirm deletion

**Expected:**
- ✅ Card disappears immediately
- ✅ No page refresh needed
- ✅ Firestore document deleted

**Verify in Firestore:**
- Check `/members` collection
- Document should be removed

#### **2.4 Real-Time Sync Test**

1. Open app in **two browser windows** (or incognito + normal)
2. Login as `admin@ncd.com` in both
3. In Window 1: Create a new member
4. In Window 2: **Member should appear automatically** (no refresh)

**Expected:**
- ✅ Changes sync in real-time across windows
- ✅ No manual refresh needed
- ✅ Console shows: `✅ Members updated: X members`

---

## Test 3: Departments Module - Click & CRUD

### Objective
Verify department cards open detail view and CRUD operations work.

### Steps

#### **3.1 Department Card Click**

1. Navigate to **Departments** page (`/departments`)
2. Click on any department card (e.g., "ECODIM")
3. **Expected:** `DepartmentDashboard` modal opens with:
   - Title: `Hub: [Department Name]`
   - Tabs: Vue d'ensemble, Membres, Rapports, Paramètres
   - Overview shows: Effectif, Réunion, Status, Archivés

**If modal doesn't open:**
- Check browser console for errors
- Verify `isOpen` state is `true` in React DevTools
- Check z-index conflicts (modal uses `z-[100]`)

#### **3.2 Create Department**

1. Click **"Créer un Pôle"** button
2. Fill in form:
   - Name: `Test Department`
   - Category: `Formation`
   - Meeting Day: `Lundi`
   - Meeting Time: `18:00`
3. Click **"Créer"**

**Expected:**
- ✅ Department card appears immediately
- ✅ Firestore `/departments` collection shows new document

#### **3.3 Edit Department**

1. Click on **Test Department** card
2. Click **"Paramètres"** tab
3. Change name to `Test Department Updated`
4. Click **"Enregistrer"**

**Expected:**
- ✅ Card updates immediately
- ✅ Firestore document updated

#### **3.4 Real-Time Sync Test**

1. Open app in two windows
2. In Window 1: Create/edit department
3. In Window 2: **Changes should appear automatically**

**Expected:**
- ✅ Console shows: `✅ Departments updated: X departments`
- ✅ Changes sync in real-time

---

## Test 4: Finance Module - Records & Balances

### Objective
Verify finance records sync correctly and account balances are accurate.

### Steps

#### **4.1 Add Finance Record**

1. Navigate to **Finances** page (`/finances`)
2. Click **"Opération"** button
3. Fill in form:
   - Amount: `1000`
   - Currency: `CDF`
   - Type: `Offrande`
   - Account: `Cash`
   - Date: Today
   - Service: `1er Culte (Dim)`
4. Click **"Confirmer l'Opération"**

**Expected:**
- ✅ Record appears immediately in ledger table
- ✅ No page refresh needed
- ✅ Firestore `/finances` collection shows new document

**Verify in Firestore:**
- Check `/finances` collection
- Find document with `amount: 1000`, `currency: "CDF"`
- Verify `account: "Cash"` field exists

#### **4.2 Account Balances**

1. Add multiple records:
   - `500 CDF` to `Cash` account
   - `100 USD` to `Rawbank` account
   - `200 CDF` expense from `Cash` account
2. Check **"Soldes par Compte"** section

**Expected:**
- ✅ Cash CDF: `1300` (1000 + 500 - 200)
- ✅ Cash USD: `-` (no USD transactions)
- ✅ Rawbank USD: `100`
- ✅ Rawbank CDF: `-`

**Calculation Logic:**
- Income adds to balance
- Expenses subtract from balance
- Separate balances for CDF and USD per account

#### **4.3 Delete Finance Record**

1. Find a finance record in the ledger
2. Click delete button (if visible, requires permission)
3. Confirm deletion

**Expected:**
- ✅ Record disappears immediately
- ✅ Account balances recalculate
- ✅ Firestore document deleted

#### **4.4 Dashboard Finance Summary**

1. Navigate to **Dashboard** (`/dashboard`)
2. Check **"Recettes (USD)"** and **"Recettes (CDF)"** cards

**Expected:**
- ✅ Totals match sum of all income records (excluding expenses)
- ✅ Values update when finance records change
- ✅ No mock/stale data

**Verify:**
- Dashboard calculates: `financeRecords.filter(r => r.type !== 'Dépense').reduce((sum, r) => sum + r.amount, 0)`
- Separate totals for USD and CDF

---

## Test 5: Dashboard - Real Data Verification

### Objective
Verify Dashboard shows real data from Firestore, not mock values.

### Steps

1. **Members Count**
   - Check **"Total Membres"** card
   - **Expected:** Number matches `/members` collection count
   - **Verify:** Open Firestore Console, count documents in `/members`

2. **Last Service Attendance**
   - Check **"Dernier Culte"** card
   - **Expected:** Shows most recent attendance record from `/attendance` collection
   - **Verify:** Check `/attendance` collection, find latest `date`, verify `totalCount`

3. **Finance Totals**
   - Check **"Recettes (USD)"** and **"Recettes (CDF)"** cards
   - **Expected:** Match sum of all income records (excluding expenses)
   - **Verify:** Calculate manually from `/finances` collection

4. **Today's Agenda**
   - Check **"Agenda du Jour"** section
   - **Expected:** Shows departments with `meetingDay` matching today
   - **Verify:** Check `/departments` collection, filter by `meetingDay` or `meetingDays`

5. **Rhema du Jour**
   - Check **Morning Pulse Card** or Rhema section
   - **Expected:** Shows verse for today's date
   - **Verify:** Check `/rhema` collection, find document with `date: "YYYY-MM-DD"` (today)

### Expected Results
- ✅ All metrics show real Firestore data
- ✅ No hardcoded/mock values
- ✅ Values update when underlying data changes
- ✅ Real-time listeners keep data fresh

---

## Test 6: RBAC - Permission Boundaries

### Objective
Verify role-based access control works correctly.

### Steps

#### **6.1 SUPER_ADMIN Permissions**

1. Login as `admin@ncd.com`
2. Verify access to:
   - ✅ Members (create, edit, delete)
   - ✅ Departments (create, edit, delete)
   - ✅ Finances (view, create, edit, delete)
   - ✅ Users (manage roles)
   - ✅ Settings
   - ✅ All modules

#### **6.2 Role Change Prevention**

1. Navigate to **Users** page (`/users`)
2. Find your own user card (`admin@ncd.com`)
3. Try to change role to `VIEWER`
4. **Expected:** Error message: "You cannot remove your own SUPER_ADMIN role"

#### **6.3 Firestore Rules Enforcement**

1. Try to access Firestore directly (via console or API)
2. Attempt operations as different roles:
   - **VIEWER:** Should only read members, departments, events
   - **FINANCE_ADMIN:** Should only read/write finances
   - **DEPT_LEADER:** Should only update own department

**Expected:**
- ✅ Firestore rules block unauthorized operations
- ✅ Frontend permission checks match Firestore rules
- ✅ No security bypasses

---

## Test 7: Real-Time Sync - Multi-User Test

### Objective
Verify real-time synchronization works across multiple users.

### Steps

1. **Setup:**
   - Open app in **Window 1** (admin@ncd.com)
   - Open app in **Window 2** (admin@ncd.com or different user)

2. **Test Members:**
   - Window 1: Create member "Sync Test"
   - Window 2: **Member appears automatically** (no refresh)

3. **Test Departments:**
   - Window 1: Edit department name
   - Window 2: **Name updates automatically**

4. **Test Finances:**
   - Window 1: Add finance record
   - Window 2: **Record appears in ledger immediately**

5. **Test Dashboard:**
   - Window 1: Add member (changes count)
   - Window 2: **Dashboard "Total Membres" updates**

### Expected Results
- ✅ All changes sync in real-time
- ✅ Console shows listener update logs
- ✅ No manual refresh needed
- ✅ No race conditions or conflicts

---

## Test 8: Error Handling & Edge Cases

### Objective
Verify app handles errors gracefully.

### Steps

1. **Network Disconnection:**
   - Disconnect internet
   - Try to create member
   - **Expected:** Error message shown, operation fails gracefully

2. **Invalid Data:**
   - Try to create member without name
   - **Expected:** Form validation prevents submission

3. **Permission Denied:**
   - Login as VIEWER role
   - Try to edit member
   - **Expected:** Firestore rules block, error shown

4. **Missing Data:**
   - Check Dashboard with empty collections
   - **Expected:** Shows "0" or "-" instead of crashing

---

## Firestore Verification Checklist

After running tests, verify in Firestore Console:

### **Collections to Check:**

1. **`/users`**
   - [ ] `admin@ncd.com` document exists
   - [ ] `role: "SUPER_ADMIN"` is set correctly
   - [ ] `createdAt` and `updatedAt` timestamps present

2. **`/members`**
   - [ ] Test members created during testing
   - [ ] All fields populated correctly
   - [ ] Deleted members removed

3. **`/departments`**
   - [ ] Test departments created
   - [ ] Updates reflected correctly
   - [ ] `leaderId`, `vpId` fields populated if set

4. **`/finances`**
   - [ ] Test records created
   - [ ] `account` field present (not undefined)
   - [ ] `currency` field correct (CDF or USD)
   - [ ] Deleted records removed

5. **`/rhema`**
   - [ ] Today's Rhema document exists
   - [ ] `date` field matches today (YYYY-MM-DD)
   - [ ] `content`, `reference`, `theme` fields populated

6. **`/attendance`**
   - [ ] Attendance records present
   - [ ] `totalCount` calculated correctly

7. **`/events`**
   - [ ] Events created (if tested)
   - [ ] `start` and `end` dates saved correctly

8. **`/departmentReports`**
   - [ ] Reports submitted (if tested)
   - [ ] `departmentId` links correctly

---

## Common Issues & Solutions

### **Issue: Real-time listeners not updating**

**Symptoms:**
- Changes don't appear automatically
- Console shows no listener logs

**Solutions:**
1. Check Firestore rules allow read access
2. Verify user is authenticated
3. Check browser console for errors
4. Verify Firestore connection (check Network tab)

### **Issue: SUPER_ADMIN role not persisting**

**Symptoms:**
- Role resets to VIEWER after refresh
- Permission errors appear

**Solutions:**
1. Check `authService.ts` login function executed correctly
2. Verify Firestore write succeeded (check console logs)
3. Manually set role in Firestore Console
4. Use `ensureSuperAdmin.ts` bootstrap button

### **Issue: Department modal doesn't open**

**Symptoms:**
- Clicking department card does nothing
- No modal appears

**Solutions:**
1. Check browser console for errors
2. Verify `DepartmentDashboard` component imported correctly
3. Check `isOpen` state in React DevTools
4. Verify Modal component renders (check z-index)

### **Issue: Finance records not appearing**

**Symptoms:**
- Record created but doesn't show in ledger
- Account balances don't update

**Solutions:**
1. Check Firestore `/finances` collection for document
2. Verify listener is active (check console logs)
3. Check Firestore rules allow read access
4. Verify `account` field is set (not undefined)

---

## Performance Testing

### **Large Dataset Test**

1. **Create 100+ members:**
   - Use import script or manual creation
   - Verify app performance remains acceptable
   - Check real-time listener handles large arrays

2. **Create 50+ finance records:**
   - Verify ledger table renders efficiently
   - Check account balance calculations are fast

3. **Multiple departments:**
   - Verify department grid renders smoothly
   - Check filtering works with many departments

### **Expected Performance:**
- ✅ Page load < 3 seconds
- ✅ Real-time updates < 500ms latency
- ✅ Smooth scrolling and interactions
- ✅ No memory leaks (check DevTools Memory tab)

---

## Browser Compatibility

### **Tested Browsers:**
- ✅ Chrome/Edge (Chromium) - Recommended
- ✅ Firefox - Should work
- ✅ Safari - Should work

### **Known Issues:**
- None currently

---

## Next Steps After Testing

1. **If all tests pass:**
   - ✅ App is ready for production use
   - ✅ Document any edge cases found
   - ✅ Update this guide with new findings

2. **If tests fail:**
   - Document failure details
   - Check Firestore rules deployment
   - Verify environment variables
   - Review console errors

3. **Performance optimization:**
   - Add pagination for large datasets
   - Implement virtual scrolling for tables
   - Add loading skeletons

---

**End of Testing Guide**

**Last Updated:** 2026-01-24  
**Maintained By:** Development Team
