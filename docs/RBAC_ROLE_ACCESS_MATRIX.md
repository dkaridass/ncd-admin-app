# 🔐 RBAC Role Access Matrix

**Last Updated:** 2024-01-XX  
**Purpose:** Complete documentation of what each role can access in each module

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

## Module Access Matrix

### **Dashboard** (`/dashboard`)

| Role | View | KPIs | Widgets | Quick Actions |
|------|------|------|---------|---------------|
| SUPER_ADMIN | ✅ Full | ✅ All | ✅ All | ✅ All |
| PASTOR | ✅ Full | ✅ All | ✅ All | ✅ All |
| STAFF_ADMIN | ✅ Full | ✅ All | ✅ All | ✅ All |
| FINANCE_ADMIN | ✅ Full | ✅ Finance only | ✅ Finance widgets | ✅ Finance actions |
| DEPT_LEADER | ✅ Limited | ✅ Department only | ✅ Department widgets | ❌ None |
| VOLUNTEER | ✅ Read-only | ✅ Limited | ✅ Limited | ❌ None |
| MEMBER | ✅ Read-only | ✅ Limited | ✅ Limited | ❌ None |
| VIEWER | ✅ Read-only | ✅ Limited | ✅ Limited | ❌ None |

**Notes:**
- Finance widgets only visible to users with `VIEW_FINANCES` permission
- Department widgets filtered by user's department
- Quick actions (add member, add finance) require respective permissions

---

### **Members** (`/members`)

| Role | View List | View Detail | Create | Edit | Delete | Export |
|------|-----------|-------------|---------|------|--------|--------|
| SUPER_ADMIN | ✅ All | ✅ All | ✅ | ✅ | ✅ | ✅ |
| PASTOR | ✅ All | ✅ All | ✅ | ✅ Own dept | ✅ Own dept | ✅ |
| STAFF_ADMIN | ✅ All | ✅ All | ✅ | ✅ | ✅ | ✅ |
| FINANCE_ADMIN | ✅ All | ✅ All | ❌ | ❌ | ❌ | ✅ |
| DEPT_LEADER | ✅ All | ✅ All | ✅ Own dept | ✅ Own dept | ❌ | ✅ |
| VOLUNTEER | ✅ All | ✅ All | ❌ | ❌ | ❌ | ❌ |
| MEMBER | ✅ Own only | ✅ Own only | ❌ | ✅ Own | ❌ | ❌ |
| VIEWER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Permissions Required:**
- `VIEW_MEMBERS` - View member list/detail
- `EDIT_MEMBERS` - Edit members
- `DELETE_MEMBERS` - Delete members

**Notes:**
- PASTOR and DEPT_LEADER can only edit members in their assigned department
- MEMBER can only view/edit their own profile

---

### **Departments** (`/departments`)

| Role | View List | View Detail | Create | Edit | Delete | Reports |
|------|-----------|-------------|---------|------|--------|---------|
| SUPER_ADMIN | ✅ All | ✅ All | ✅ | ✅ | ✅ | ✅ All |
| PASTOR | ✅ All | ✅ All | ✅ | ✅ | ✅ | ✅ All |
| STAFF_ADMIN | ✅ All | ✅ All | ✅ | ✅ | ✅ | ✅ All |
| FINANCE_ADMIN | ✅ All | ✅ All | ❌ | ❌ | ❌ | ✅ View only |
| DEPT_LEADER | ✅ All | ✅ Own dept | ❌ | ✅ Own dept | ❌ | ✅ Own dept |
| VOLUNTEER | ✅ All | ✅ All | ❌ | ❌ | ❌ | ❌ |
| MEMBER | ✅ All | ✅ All | ❌ | ❌ | ❌ | ❌ |
| VIEWER | ✅ All | ✅ All | ❌ | ❌ | ❌ | ❌ |

**Permissions Required:**
- `MANAGE_DEPARTMENTS` - Create/edit/delete departments

**Notes:**
- DEPT_LEADER can only manage their own department
- All authenticated users can view departments (for ministry purposes)

---

### **Finance** (`/finances`)

| Role | View List | View Detail | Create | Edit | Delete | Approve | Export |
|------|-----------|-------------|---------|------|--------|---------|--------|
| SUPER_ADMIN | ✅ All | ✅ All | ✅ | ✅ | ✅ | ✅ | ✅ |
| PASTOR | ✅ All | ✅ All | ❌ | ❌ | ❌ | ❌ | ✅ |
| STAFF_ADMIN | ✅ All | ✅ All | ✅ | ❌ | ❌ | ❌ | ✅ |
| FINANCE_ADMIN | ✅ All | ✅ All | ✅ | ✅ | ✅ | ✅ | ✅ |
| DEPT_LEADER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| VOLUNTEER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MEMBER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| VIEWER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Permissions Required:**
- `VIEW_FINANCES` - View finance records
- `CREATE_FINANCES` - Create finance records (STAFF_ADMIN can record offerings)
- `EDIT_FINANCES` - Edit finance records
- `DELETE_FINANCES` - Delete finance records

**Notes:**
- STAFF_ADMIN can create records (for recording offerings) but cannot edit/delete
- Only FINANCE_ADMIN and SUPER_ADMIN have full CRUD access

---

### **Programme** (`/events`)

#### **Weekly Services**

| Role | View | Create | Edit | Delete |
|------|------|--------|------|--------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ |
| PASTOR | ✅ | ✅ | ✅ | ✅ |
| STAFF_ADMIN | ✅ | ✅ | ✅ | ✅ |
| FINANCE_ADMIN | ✅ | ❌ | ❌ | ❌ |
| DEPT_LEADER | ✅ | ❌ | ❌ | ❌ |
| VOLUNTEER | ✅ | ❌ | ❌ | ❌ |
| MEMBER | ✅ | ❌ | ❌ | ❌ |
| VIEWER | ✅ | ❌ | ❌ | ❌ |

#### **Annual Programme**

| Role | View | Create | Edit | Delete |
|------|------|--------|------|--------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ |
| PASTOR | ✅ | ✅ | ✅ | ✅ |
| STAFF_ADMIN | ✅ | ✅ | ✅ | ✅ |
| FINANCE_ADMIN | ✅ | ❌ | ❌ | ❌ |
| DEPT_LEADER | ✅ | ❌ | ❌ | ❌ |
| VOLUNTEER | ✅ | ❌ | ❌ | ❌ |
| MEMBER | ✅ | ❌ | ❌ | ❌ |
| VIEWER | ✅ | ❌ | ❌ | ❌ |

**Permissions Required:**
- `MANAGE_DEPARTMENTS` - Create/edit/delete programme (same as departments)

**Notes:**
- All authenticated users can view programme
- Only SUPER_ADMIN, PASTOR, STAFF_ADMIN can manage programme

---

### **Annonces (Announcements)** (`/announcements`)

| Role | View | Create | Edit | Delete | Archive |
|------|------|--------|------|--------|---------|
| SUPER_ADMIN | ✅ All | ✅ | ✅ | ✅ | ✅ |
| PASTOR | ✅ All | ✅ | ✅ | ✅ | ✅ |
| STAFF_ADMIN | ✅ All | ✅ | ✅ | ✅ | ✅ |
| FINANCE_ADMIN | ✅ All | ❌ | ❌ | ❌ | ❌ |
| DEPT_LEADER | ✅ All | ❌ | ❌ | ❌ | ❌ |
| VOLUNTEER | ✅ All | ❌ | ❌ | ❌ | ❌ |
| MEMBER | ✅ All | ❌ | ❌ | ❌ | ❌ |
| VIEWER | ✅ All | ❌ | ❌ | ❌ | ❌ |

**Permissions Required:**
- `MANAGE_ANNOUNCEMENTS` - Create/edit/delete announcements

**Notes:**
- All authenticated users can view announcements
- Only SUPER_ADMIN, PASTOR, STAFF_ADMIN can manage announcements

---

### **Ressources (Resources)** (`/resources`)

| Role | View | Download | Create | Edit | Delete |
|------|------|----------|--------|------|--------|
| SUPER_ADMIN | ✅ All | ✅ | ✅ | ✅ | ✅ |
| PASTOR | ✅ All | ✅ | ❌ | ❌ | ❌ |
| STAFF_ADMIN | ✅ All | ✅ | ✅ | ✅ | ✅ |
| FINANCE_ADMIN | ✅ All | ✅ | ❌ | ❌ | ❌ |
| DEPT_LEADER | ✅ All | ✅ | ❌ | ❌ | ❌ |
| VOLUNTEER | ✅ All | ✅ | ❌ | ❌ | ❌ |
| MEMBER | ✅ All | ✅ | ❌ | ❌ | ❌ |
| VIEWER | ✅ All | ✅ | ❌ | ❌ | ❌ |

**Permissions Required:**
- `MANAGE_RESOURCES` - Create/edit/delete resources

**Notes:**
- All authenticated users can view and download resources
- Only SUPER_ADMIN and STAFF_ADMIN can manage resources

---

### **Bénévoles (Volunteers)** (`/volunteers`)

| Role | View List | View Detail | Mark as Volunteer | Assign Roles |
|------|-----------|-------------|-------------------|--------------|
| SUPER_ADMIN | ✅ All | ✅ All | ✅ | ✅ |
| PASTOR | ✅ All | ✅ All | ✅ | ✅ |
| STAFF_ADMIN | ✅ All | ✅ All | ✅ | ✅ |
| FINANCE_ADMIN | ✅ All | ✅ All | ❌ | ❌ |
| DEPT_LEADER | ✅ Own dept | ✅ Own dept | ✅ Own dept | ✅ Own dept |
| VOLUNTEER | ✅ All | ✅ All | ❌ | ❌ |
| MEMBER | ✅ All | ✅ All | ❌ | ❌ |
| VIEWER | ❌ | ❌ | ❌ | ❌ |

**Permissions Required:**
- `VIEW_MEMBERS` - View volunteers (volunteers are members with `isVolunteer: true`)
- `EDIT_MEMBERS` - Mark members as volunteers

**Notes:**
- Volunteers are managed through the Members module
- DEPT_LEADER can only manage volunteers in their department

---

### **Requêtes de Prières (Prayer Requests)** (`/prayer-requests`)

| Role | View Public | View Private | Create | Update Status | Delete |
|------|------------|--------------|--------|---------------|--------|
| SUPER_ADMIN | ✅ All | ✅ All | ✅ | ✅ | ✅ |
| PASTOR | ✅ All | ✅ All | ✅ | ✅ | ✅ |
| STAFF_ADMIN | ✅ Public | ❌ | ✅ | ❌ | ❌ |
| FINANCE_ADMIN | ✅ Public | ❌ | ✅ | ❌ | ❌ |
| DEPT_LEADER | ✅ Public | ❌ | ✅ | ❌ | ❌ |
| VOLUNTEER | ✅ Public | ❌ | ✅ | ❌ | ❌ |
| MEMBER | ✅ Public + Own | ✅ Own | ✅ | ✅ Own | ✅ Own |
| VIEWER | ✅ Public | ❌ | ✅ | ❌ | ❌ |

**Permissions Required:**
- `VIEW_PRIVATE_PRAYERS` - View private prayer requests (SUPER_ADMIN, PASTOR only)
- All authenticated users can create requests
- Authors can update/delete their own requests
- SUPER_ADMIN and PASTOR can update/delete any request

**Notes:**
- Private requests (`isPrivate: true`) are only visible to:
  - SUPER_ADMIN
  - PASTOR
  - The author of the request
- Public requests are visible to all authenticated users

---

### **Gestion des Utilisateurs (Users & Roles)** (`/users`)

| Role | View List | View Detail | Change Role | Activate/Deactivate |
|------|-----------|-------------|-------------|---------------------|
| SUPER_ADMIN | ✅ All | ✅ All | ✅ | ✅ |
| PASTOR | ❌ | ❌ | ❌ | ❌ |
| STAFF_ADMIN | ❌ | ❌ | ❌ | ❌ |
| FINANCE_ADMIN | ❌ | ❌ | ❌ | ❌ |
| DEPT_LEADER | ❌ | ❌ | ❌ | ❌ |
| VOLUNTEER | ❌ | ❌ | ❌ | ❌ |
| MEMBER | ❌ | ❌ | ❌ | ❌ |
| VIEWER | ❌ | ❌ | ❌ | ❌ |

**Permissions Required:**
- `MANAGE_ROLES` - Change user roles (SUPER_ADMIN only)

**Notes:**
- Only SUPER_ADMIN can access the Users page
- SUPER_ADMIN cannot remove their own SUPER_ADMIN role
- SUPER_ADMIN cannot deactivate their own account

---

## Permission Summary by Role

### **SUPER_ADMIN**
- ✅ All permissions
- ✅ Can manage roles
- ✅ Can access all modules
- ✅ Can deactivate users (except self)

### **PASTOR**
- ✅ View members, departments, programme, announcements
- ✅ Manage departments, programme, announcements
- ✅ View private prayer requests
- ✅ Send messages
- ❌ Cannot manage finances (view only)
- ❌ Cannot manage resources (view only)
- ❌ Cannot manage users/roles

### **STAFF_ADMIN**
- ✅ View/edit members
- ✅ Create finance records (offerings)
- ✅ Manage departments, programme, announcements, resources
- ✅ View public prayer requests
- ❌ Cannot edit/delete finance records
- ❌ Cannot view private prayer requests
- ❌ Cannot manage users/roles

### **FINANCE_ADMIN**
- ✅ Full access to Finance module
- ✅ View members, departments, programme, announcements, resources
- ❌ Cannot edit members
- ❌ Cannot manage departments, programme, announcements, resources
- ❌ Cannot view private prayer requests
- ❌ Cannot manage users/roles

### **DEPT_LEADER**
- ✅ View all members
- ✅ Edit members in own department
- ✅ View own department details
- ✅ Manage own department reports
- ❌ Cannot create/edit departments
- ❌ Cannot access finance
- ❌ Cannot manage programme, announcements, resources
- ❌ Cannot view private prayer requests

### **VOLUNTEER**
- ✅ View members
- ✅ View departments
- ✅ View programme, announcements, resources
- ✅ View public prayer requests
- ❌ Cannot edit anything
- ❌ Cannot access finance

### **MEMBER**
- ✅ View own profile
- ✅ Edit own profile
- ✅ View departments, programme, announcements, resources
- ✅ View public prayer requests + own private requests
- ✅ Create prayer requests
- ✅ Update/delete own prayer requests
- ❌ Cannot view other members
- ❌ Cannot access finance

### **VIEWER**
- ✅ View departments, programme, announcements, resources
- ✅ View public prayer requests
- ✅ Create prayer requests
- ❌ Cannot view members
- ❌ Cannot access finance
- ❌ Cannot edit anything

---

## Firestore Security Rules Mapping

### **Read Access**
- **All authenticated users:** Members (read), Departments (read), Programme (read), Announcements (read), Resources (read)
- **Role-specific:** Finance (FINANCE_ADMIN, SUPER_ADMIN), Private Prayer Requests (SUPER_ADMIN, PASTOR, author)

### **Write Access**
- **SUPER_ADMIN:** All collections
- **PASTOR:** Members, Departments, Programme, Announcements
- **STAFF_ADMIN:** Members, Departments, Programme, Announcements, Resources, Finance (create only)
- **FINANCE_ADMIN:** Finance only
- **DEPT_LEADER:** Own department only
- **All authenticated:** Prayer Requests (create), Own profile (update)

---

**Last Updated:** 2024-01-XX  
**Status:** Complete & Production Ready
