# 🔍 NCD Admin App - Comprehensive Audit Report

**Date:** 2026-01-24  
**Auditor:** Principal Fullstack Engineer  
**Purpose:** Deep audit & stabilization of RBAC, Firebase integration, and core modules

---

## 1. Firebase Configuration & Initialization

### ✅ Current State
- **Location:** `firebase.ts`
- **Configuration:** Uses environment variables (`VITE_FIREBASE_*`)
- **Services Initialized:**
  - `auth` - Firebase Authentication
  - `db` - Firestore Database
  - `storage` - Firebase Storage

### ⚠️ Issues Found
- **None critical** - Configuration is clean and follows best practices
- Environment variables must be set in `.env` file (not found in repo - expected)

---

## 2. Authentication & RBAC Implementation

### ✅ Current Architecture

#### **Role Storage**
- **Location:** Firestore `/users/{userId}` collection
- **Structure:**
  ```typescript
  {
    id: string,
    email: string,
    name: string,
    role: AppRole,  // SUPER_ADMIN | PASTOR | FINANCE_ADMIN | etc.
    createdAt: string,
    updatedAt?: string
  }
  ```

#### **Role Assignment Logic**
- **Location:** `services/authService.ts`
- **SUPER_ADMIN Auto-Assignment:**
  - ✅ Implemented in `login()` function (lines 22-28)
  - ✅ Implemented in `register()` function (lines 79-87)
  - ✅ Email check: `admin@ncd.com` (case-insensitive)
  - ✅ Fallback utility: `utils/ensureSuperAdmin.ts` (bootstrap button)

#### **Role Retrieval**
- **Location:** `context/DataContext.tsx` (lines 114-161)
- **Implementation:** Real-time listener using `onSnapshot`
- ✅ **FIXED:** Previously used one-time reads (race conditions)
- ✅ Now uses `onSnapshot` for instant role updates

#### **Permission System**
- **Location:** `context/DataContext.tsx` (lines 17-33)
- **Structure:** `ROLE_PERMISSIONS` mapping
- **Enforcement:**
  - **Frontend:** `PermissionGuard` component (UI hints only)
  - **Backend:** Firestore Security Rules (actual enforcement)

### ⚠️ Issues Found

#### **Issue #1: SUPER_ADMIN Role Consistency**
- **Problem:** Role can fall back to VIEWER if:
  - User document exists with wrong role
  - Auto-assignment fails silently
  - Race condition during login
- **Impact:** Admin loses access to critical features
- **Fix Required:** ✅ Already partially fixed with `ensureSuperAdmin.ts`, but needs hardening

#### **Issue #2: Role Check Duplication**
- **Problem:** Role checks scattered across:
  - `DataContext.tsx` - `hasPermission()`
  - `firestore.rules` - Security rules
  - Individual components - Direct role checks
- **Impact:** Inconsistency risk, harder to maintain
- **Fix Required:** Centralize role logic (already mostly done via `hasPermission()`)

---

## 3. Core Modules Analysis

### 3.1 Members Module

#### **Service Layer**
- **Location:** `services/membersService.ts`
- **Operations:** ✅ CRUD fully implemented
  - `getAll()` - Fetches with `orderBy('name')`
  - `getById()` - Single member fetch
  - `add()` - Creates new member
  - `update()` - Updates existing member
  - `delete()` - Deletes member

#### **UI Layer**
- **Location:** `pages/MembersPage.tsx`, `components/members/`
- **Components:**
  - `MembersTable` - Table view
  - `MemberCard` - Card grid view
  - `MemberDrawer` - Create/Edit drawer

#### **Data Flow**
- **Context:** `DataContext.tsx` (lines 281-312)
- **State Management:** Uses service layer + local state updates
- **Real-time Sync:** ❌ **NOT IMPLEMENTED** - Uses one-time fetch on mount

### ⚠️ Issues Found

#### **Issue #3: Members Not Real-Time**
- **Problem:** `members` state only updates on:
  - Initial load (line 206)
  - Manual CRUD operations (lines 285, 292, 302)
- **Impact:** 
  - Changes from other users don't appear
  - Delete operations may not reflect immediately
  - Race conditions possible
- **Fix Required:** Add `onSnapshot` listener for `/members` collection

#### **Issue #4: Member Delete Flow**
- **Problem:** Delete function exists but may have sync issues
- **Location:** `DataContext.tsx` line 296-312
- **Status:** Has error handling, but no real-time listener means UI might not update if Firestore write succeeds but listener hasn't fired

---

### 3.2 Departments Module

#### **Service Layer**
- **Location:** `services/departmentsService.ts`
- **Operations:** ✅ CRUD implemented
  - `getAll()` - Fetches with `orderBy('name')`
  - `add()`, `update()`, `delete()` - Standard operations

#### **UI Layer**
- **Location:** `pages/DepartmentsPage.tsx`
- **Components:**
  - `DepartmentCard` - Grid card view
  - `DepartmentDashboard` - Detail view modal
  - `AddDepartmentModal` - Create form

#### **Data Flow**
- **Context:** `DataContext.tsx` (lines 336-355)
- **Real-time Sync:** ❌ **NOT IMPLEMENTED** - One-time fetch only

### ⚠️ Issues Found

#### **Issue #5: Department Click Not Working**
- **Problem:** `DepartmentCard` onClick calls `handleOpenReportHub()` which sets `selectedDept` and opens `DepartmentDashboard` modal
- **Location:** `pages/DepartmentsPage.tsx` lines 58-61, 137-141
- **Status:** Logic appears correct, but modal might not be rendering properly
- **Fix Required:** Verify `DepartmentDashboard` component renders correctly

#### **Issue #6: Departments Not Real-Time**
- **Problem:** Same as Members - no `onSnapshot` listener
- **Impact:** Changes don't sync across users

---

### 3.3 Finance Module

#### **Service Layer**
- **Location:** `services/financeService.ts`
- **Operations:** ✅ CRUD + Approve implemented
  - `getAll()` - Fetches with `orderBy('date', 'desc')` limit 200
  - `add()` - Creates record with account support
  - `update()`, `delete()`, `approve()` - Standard operations

#### **UI Layer**
- **Location:** `pages/FinancesPage.tsx`
- **Features:**
  - Batch entry mode
  - Account balances (multi-account: Rawbank, Equity, Mpesa, etc.)
  - Date range filtering
  - Export functionality

#### **Data Flow**
- **Context:** `DataContext.tsx` (lines 168-193)
- **Real-time Sync:** ✅ **IMPLEMENTED** - Uses `onSnapshot` listener!
- **Status:** ✅ **WORKING** - Finance records sync in real-time

### ⚠️ Issues Found

#### **Issue #7: Dashboard Finance Summary**
- **Problem:** Dashboard calculates totals from `financeRecords` array
- **Location:** `pages/DashboardPage.tsx` lines 51-52
- **Status:** Should work if `financeRecords` is populated correctly
- **Fix Required:** Verify dashboard shows real totals, not mock values

#### **Issue #8: Account Balances Calculation**
- **Problem:** Calculated in-memory from `financeRecords` array
- **Location:** `pages/FinancesPage.tsx` lines 237-258
- **Status:** ✅ Logic is correct, but depends on real-time listener working

---

### 3.4 Dashboard Module

#### **Data Sources**
- **Members:** `members.length` (line 284)
- **Attendance:** `attendance[0]` (last session) (line 46)
- **Finance:** `financeRecords` filtered (lines 51-52)
- **Departments:** `departments` filtered by meeting day (lines 34-38)
- **Tasks:** `tasks` filtered (line 54)

#### **Real-Time Status**
- ✅ Finance: Real-time listener
- ❌ Members: One-time fetch
- ❌ Attendance: One-time fetch
- ❌ Departments: One-time fetch
- ❌ Tasks: One-time fetch (but tasks are not implemented in service layer)

### ⚠️ Issues Found

#### **Issue #9: Dashboard Uses Mock/Stale Data**
- **Problem:** Some metrics rely on one-time fetches
- **Impact:** Dashboard may show outdated information
- **Fix Required:** Add real-time listeners for all collections

#### **Issue #10: Tasks Not Implemented**
- **Problem:** `tasks` array is empty (no service layer)
- **Location:** `DataContext.tsx` - tasks state exists but no service
- **Impact:** "À Faire" section shows empty

---

### 3.5 Rhema (Daily Word) Module

#### **Service Layer**
- **Location:** `services/rhemaService.ts`
- **Operations:**
  - `generateDailyRhema()` - AI-generated via Gemini
  - `generateFallbackRhema()` - Uses French Bible verses
  - `getForDate()` - Fetches for specific date

#### **Data Flow**
- **Context:** `DataContext.tsx` (lines 213-219)
- **Auto-Generation:** ✅ Generates if missing for today
- **Storage:** Firestore `/rhema` collection

### ✅ Status: Working correctly

---

## 4. Mock/Seed Data Analysis

### **Found Mock Data Locations**

1. **`data/archive/`** - Deprecated mock data (✅ Already archived)
   - `members.json`
   - `departments.json`
   - `mockData.ts`

2. **`utils/seedDatabase.ts`** - Seed utility (✅ Not used in production)
   - Only called from Settings page (dev tool)
   - Not imported in production code

3. **`pages/SettingsPage.tsx`** - Has seed button (✅ Dev tool only)

### ✅ Status: Mock data is properly isolated

---

## 5. Firestore Security Rules

### **Current Rules** (`firestore.rules`)

#### ✅ **Well-Structured:**
- Helper functions for role checks
- Collection-specific rules
- Default deny-all security

#### **Rules Summary:**
- `/users` - Read: Admins + self, Write: Admins + self
- `/members` - Read: All authenticated, Write: Admins/Pastors/Staff
- `/departments` - Read: All authenticated, Write: Super Admin + Dept Leaders (own dept)
- `/finances` - Read/Write: Super Admin + Finance Admin only
- `/events` - Read: All authenticated, Write: Admins/Pastors/Staff
- `/attendance` - Read: All authenticated, Write: Admins/Pastors/Staff
- `/rhema` - Read: All authenticated, Write: All authenticated

### ✅ Status: Rules are comprehensive and secure

---

## 6. Critical Issues Summary

### **High Priority**

1. **SUPER_ADMIN Role Consistency** ⚠️
   - Auto-assignment exists but can fail silently
   - Need to ensure role never falls back to VIEWER

2. **Members Not Real-Time** ❌
   - No `onSnapshot` listener
   - Changes don't sync across users

3. **Departments Not Real-Time** ❌
   - No `onSnapshot` listener
   - Department click may not work properly

4. **Dashboard Stale Data** ⚠️
   - Some metrics rely on one-time fetches
   - May show outdated information

### **Medium Priority**

5. **Tasks Not Implemented** ❌
   - Service layer missing
   - Dashboard "À Faire" section empty

6. **Account Balances** ⚠️
   - Calculated correctly but depends on real-time listener
   - Should verify accuracy

### **Low Priority**

7. **Mock Data Cleanup** ✅
   - Already isolated in archive
   - No action needed

---

## 7. Recommendations

### **Immediate Actions**

1. ✅ Add real-time listeners for Members and Departments
2. ✅ Harden SUPER_ADMIN role assignment (verify after write)
3. ✅ Fix DepartmentDashboard modal rendering
4. ✅ Verify Dashboard shows real data (not mock)

### **Short-Term Improvements**

1. Implement Tasks service layer
2. Add real-time listener for Attendance
3. Add error boundaries for failed Firestore operations
4. Add loading states for async operations

### **Long-Term Enhancements**

1. Add audit logging for role changes
2. Implement department report submission flow
3. Add email/SMS integration for communications
4. Performance optimization for large datasets

---

## 8. Testing Checklist

### **SUPER_ADMIN Login**
- [ ] Login as `admin@ncd.com`
- [ ] Verify role is `SUPER_ADMIN` in Firestore
- [ ] Verify all modules accessible
- [ ] Test role change prevention (can't remove own SUPER_ADMIN)

### **Members Module**
- [ ] Create new member
- [ ] Edit existing member
- [ ] Delete member
- [ ] Verify changes appear in real-time (open in two browsers)

### **Departments Module**
- [ ] Click department card
- [ ] Verify DepartmentDashboard opens
- [ ] Create new department
- [ ] Edit department
- [ ] Verify changes sync in real-time

### **Finance Module**
- [ ] Add offering/tithe
- [ ] Add expense
- [ ] Verify record appears immediately
- [ ] Check account balances update
- [ ] Verify dashboard totals update

### **Dashboard**
- [ ] Verify all metrics show real data
- [ ] Check Rhema displays correctly
- [ ] Verify attendance chart shows real data

---

**End of Audit Report**
