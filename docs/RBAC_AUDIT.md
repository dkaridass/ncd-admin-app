# 🔐 RBAC Audit & User Management System

**Date:** 2024-01-XX  
**Auditor:** Principal Fullstack Engineer & RBAC Architect  
**Purpose:** Comprehensive audit and stabilization of User & Role management system

---

## 1. Current Authentication & User Storage

### **Authentication Method**
- **Service:** Firebase Authentication
- **Location:** `services/authService.ts`
- **Method:** Email/Password authentication via `signInWithEmailAndPassword()`

### **User Profile Storage**
- **Collection:** `/users/{userId}` in Firestore
- **Document Structure:**
  ```typescript
  {
    id: string;              // Firebase Auth UID
    name: string;            // Display name
    email: string;           // Email address
    role: AppRole;           // Current role (see roles below)
    departmentId?: string;   // Optional department assignment
    avatarUrl?: string;      // Optional profile picture
    createdAt?: string;      // ISO date string
    updatedAt?: string;      // ISO date string (when role changed)
  }
  ```

### **Role Storage Mechanism**
- **Source of Truth:** Firestore `/users/{userId}.role` field
- **NOT using Firebase Custom Claims** (kept simple for now)
- **Real-Time Updates:** `onSnapshot` listener in `DataContext.tsx` ensures role changes reflect immediately

---

## 2. Current Roles & Hierarchy

### **Role List (8 roles total)**

1. **SUPER_ADMIN** - Full system access (Apostle/Senior Pastor)
2. **PASTOR** - Pastoral care, member management, announcements
3. **STAFF_ADMIN** - Day-to-day operations, member editing
4. **FINANCE_ADMIN** - Financial records only
5. **DEPT_LEADER** - Department-specific access
6. **VOLUNTEER** - Limited pastoral care view
7. **MEMBER** - Basic pastoral care view
8. **VIEWER** - Read-only access (default for new users)

### **Role Assignment Logic**

**Automatic Assignment:**
- `admin@ncd.com` → Automatically assigned `SUPER_ADMIN` role on login/registration
- All other users → Default to `VIEWER` role

**Manual Assignment:**
- Only `SUPER_ADMIN` can change user roles via Users page
- Changes apply immediately via real-time listener

---

## 3. Permission System

### **Permission Mapping**
- **Location:** `context/DataContext.tsx` - `ROLE_PERMISSIONS` constant
- **Structure:** `Record<AppRole, Permission[]>`

### **Current Permissions:**
```typescript
VIEW_MEMBERS, EDIT_MEMBERS, DELETE_MEMBERS
VIEW_FINANCES, CREATE_FINANCES, EDIT_FINANCES, DELETE_FINANCES
VIEW_PASTORAL_CARE, VIEW_PRIVATE_PRAYERS
MANAGE_DEPARTMENTS, MANAGE_SETTINGS, ACCESS_AI_CONFIG
MANAGE_TASKS, MANAGE_ANNOUNCEMENTS, MANAGE_RESOURCES
MANAGE_ROLES
SEND_MESSAGES, MANAGE_TEMPLATES
```

### **Permission Checks**
- **Frontend:** `hasPermission(permission)` function in `DataContext`
- **UI Component:** `PermissionGuard` component wraps protected UI elements
- **Backend:** Firestore Security Rules enforce actual access control

---

## 4. Role Access Matrix by Module

### **Dashboard**
- **SUPER_ADMIN:** Full access, all KPIs, all widgets
- **PASTOR:** Full access, all KPIs, all widgets
- **STAFF_ADMIN:** Full access, all KPIs, all widgets
- **FINANCE_ADMIN:** Full access, finance-focused KPIs
- **DEPT_LEADER:** Limited access, department-specific widgets
- **VOLUNTEER:** Read-only access
- **MEMBER:** Read-only access
- **VIEWER:** Read-only access

### **Members**
- **SUPER_ADMIN:** Full CRUD
- **PASTOR:** View all, edit own department members
- **STAFF_ADMIN:** Full CRUD
- **FINANCE_ADMIN:** View only
- **DEPT_LEADER:** View all, edit own department members
- **VOLUNTEER:** View only
- **MEMBER:** View only (own profile)
- **VIEWER:** No access

### **Departments**
- **SUPER_ADMIN:** Full CRUD
- **PASTOR:** Full CRUD
- **STAFF_ADMIN:** Full CRUD
- **FINANCE_ADMIN:** View only
- **DEPT_LEADER:** View all, manage own department
- **VOLUNTEER:** View only
- **MEMBER:** View only
- **VIEWER:** View only

### **Finance**
- **SUPER_ADMIN:** Full CRUD
- **PASTOR:** View only
- **STAFF_ADMIN:** Create records (offerings)
- **FINANCE_ADMIN:** Full CRUD
- **DEPT_LEADER:** No access
- **VOLUNTEER:** No access
- **MEMBER:** No access
- **VIEWER:** No access

### **Programme (Weekly & Annual)**
- **SUPER_ADMIN:** Full CRUD
- **PASTOR:** Full CRUD
- **STAFF_ADMIN:** Full CRUD
- **FINANCE_ADMIN:** View only
- **DEPT_LEADER:** View only
- **VOLUNTEER:** View only
- **MEMBER:** View only
- **VIEWER:** View only

### **Annonces (Announcements)**
- **SUPER_ADMIN:** Full CRUD
- **PASTOR:** Full CRUD
- **STAFF_ADMIN:** Full CRUD
- **FINANCE_ADMIN:** View only
- **DEPT_LEADER:** View only
- **VOLUNTEER:** View only
- **MEMBER:** View only
- **VIEWER:** View only

### **Ressources (Resources)**
- **SUPER_ADMIN:** Full CRUD
- **PASTOR:** View only
- **STAFF_ADMIN:** Full CRUD
- **FINANCE_ADMIN:** View only
- **DEPT_LEADER:** View only
- **VOLUNTEER:** View only
- **MEMBER:** View only
- **VIEWER:** View only

### **Bénévoles (Volunteers)**
- **SUPER_ADMIN:** Full access
- **PASTOR:** View all
- **STAFF_ADMIN:** Full access
- **FINANCE_ADMIN:** View only
- **DEPT_LEADER:** View own department volunteers
- **VOLUNTEER:** View only
- **MEMBER:** View only
- **VIEWER:** No access

### **Requêtes de Prières (Prayer Requests)**
- **SUPER_ADMIN:** View all (including private)
- **PASTOR:** View all (including private)
- **STAFF_ADMIN:** View public only
- **FINANCE_ADMIN:** View public only
- **DEPT_LEADER:** View public only
- **VOLUNTEER:** View public only
- **MEMBER:** View own + public
- **VIEWER:** View public only

---

## 5. Current Implementation Files

### **Service Layer**
- `services/authService.ts` - Authentication & user profile management
- `utils/ensureSuperAdmin.ts` - Bootstrap utility for SUPER_ADMIN

### **Context & State**
- `context/DataContext.tsx` - Centralized state, permission checks, role management

### **UI Components**
- `pages/UsersPage.tsx` - User & role management interface
- `components/auth/PermissionGuard.tsx` - Permission-based UI wrapper

### **Security Rules**
- `firestore.rules` - Firestore security rules with role-based access control

---

## 6. Issues & Improvements Needed

### **Current Issues:**
1. ✅ User interface lacks `isActive` status field
2. ✅ UsersPage could have better filtering and status management
3. ✅ No centralized role check helper utilities
4. ✅ Role access matrix not fully documented in code comments
5. ✅ Some modules may have inconsistent permission checks

### **Improvements to Implement:**
1. Add `isActive` and `status` fields to User interface
2. Enhance UsersPage with status toggle and better UI
3. Create centralized role check helpers (`utils/rbac.ts`)
4. Add code comments documenting role access for each module
5. Ensure consistent permission checks across all modules

---

## 7. Firestore Security Rules

### **Current Rules:**
- Users collection: Read (admins/staff/self), Write (admins/self)
- Members: Read (all authenticated), Write (admins/staff/pastors)
- Finance: Read/Write (SUPER_ADMIN, FINANCE_ADMIN)
- Departments: Read (all authenticated), Write (admins/staff/pastors)
- Announcements: Read (all authenticated), Write (admins/staff/pastors)
- Resources: Read (all authenticated), Write (admins/staff/pastors)
- Prayer Requests: Read (varies by privacy), Write (all authenticated)

### **Rule Helper Functions:**
- `isAuthenticated()` - Check if user is logged in
- `getUserData()` - Get user document from Firestore
- `hasRole(role)` - Check if user has specific role
- `isSuperAdmin()`, `isPastor()`, `isFinanceAdmin()`, `isStaffAdmin()`, `isDeptLeader()` - Role shortcuts

---

## 8. Testing Status

- ✅ Authentication flow works
- ✅ Role assignment works
- ✅ Real-time role updates work
- ✅ Permission checks work
- ⚠️ UsersPage needs enhancement
- ⚠️ Status management not implemented
- ⚠️ Comprehensive role testing needed

---

**Last Updated:** 2024-01-XX  
**Status:** Audit Complete - Ready for Implementation
