# 🧪 Testing Guide: Bénévoles & Requêtes de Prières

**Date:** 2026-01-24  
**Purpose:** Complete testing guide for Volunteers and Prayer Requests modules

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Firestore Data Structure](#firestore-data-structure)
4. [Testing Volunteers (Bénévoles)](#testing-volunteers-bénévoles)
5. [Testing Prayer Requests (Requêtes de Prières)](#testing-prayer-requests-requêtes-de-prières)
6. [Integration Testing](#integration-testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This guide covers testing for two new modules:

1. **Bénévoles (Volunteers)**: Management of church volunteers, their roles, departments, and status
2. **Requêtes de Prières (Prayer Requests)**: Submission and management of prayer requests with privacy controls

Both modules are fully integrated with Firebase Firestore and the existing RBAC system.

---

## ✅ Prerequisites

1. **Firebase Setup:**
   - Firebase project configured (`ncd-admin-app`)
   - Firestore rules deployed
   - Environment variables set in `.env`

2. **User Accounts:**
   - `admin@ncd.com` (SUPER_ADMIN role)
   - A test member account (MEMBER role)
   - A test pastor account (PASTOR role) - optional

3. **App Running:**
   ```bash
   npm run dev
   ```

4. **Firestore Rules Deployed:**
   ```bash
   firebase deploy --only firestore:rules --project ncd-admin-app
   ```

---

## 🗄️ Firestore Data Structure

### **Volunteers (stored in `/members` collection)**

Volunteer information is stored as fields on the `Member` document:

```typescript
{
  id: "member-id-123",
  name: "Jean Baptiste",
  // ... other member fields ...
  
  // Volunteer fields
  isVolunteer: true,
  volunteerRoles: ["Accueil", "Sécurité"],
  volunteerDepartmentId: "dept-id-456",
  volunteerStatus: "Actif" | "Inactif" | "En pause",
  volunteerStartDate: "2025-01-15" // ISO date string
}
```

**Key Fields:**
- `isVolunteer: boolean` - Marks member as volunteer
- `volunteerRoles: string[]` - Array of volunteer roles (e.g., ["Accueil", "Sécurité", "Son"])
- `volunteerDepartmentId: string` - Primary department where they volunteer
- `volunteerStatus: 'Actif' | 'Inactif' | 'En pause'` - Current volunteer status
- `volunteerStartDate: string` - When they started volunteering (ISO date)

---

### **Prayer Requests (stored in `/prayer_requests` collection)**

```typescript
{
  id: "request-id-789",
  title: "Prière pour la santé", // Optional
  content: "Je demande la prière pour ma santé...",
  submittedBy: "Fr. Jean",
  authorId: "firebase-auth-uid", // Optional - if logged in
  memberId: "member-id-123", // Optional - if linked to member
  isPrivate: false,
  status: "En attente" | "En cours" | "Exaucée" | "Archivée",
  category: "Santé" | "Famille" | "Finances" | "Travail" | "Spiritualité" | "Autre", // Optional
  createdAt: "2026-01-24T10:30:00.000Z", // ISO timestamp
  updatedAt: "2026-01-24T10:30:00.000Z", // ISO timestamp
  prayedBy: ["user-id-1", "user-id-2"], // Array of user IDs who prayed
  notes: "Internal notes..." // Optional - only visible to authorized roles
}
```

**Key Fields:**
- `content: string` - Main prayer request content (required)
- `submittedBy: string` - Display name of requester (required)
- `isPrivate: boolean` - Private (only visible to requester + authorized roles) vs Public
- `status: string` - Request status (default: "En attente")
- `authorId: string` - Firebase Auth UID (if logged in)
- `category: string` - Optional category for organization

---

## 👥 Testing Volunteers (Bénévoles)

### **Test 1: Mark a Member as Volunteer**

**Steps:**
1. Login as `admin@ncd.com`
2. Navigate to `/members`
3. Click on an existing member (or create a new one)
4. In the member form, scroll to the "Bénévole" section
5. Check the "Bénévole" checkbox
6. Fill in volunteer information:
   - **Département de Bénévolat**: Select a department (e.g., "ACCUEIL")
   - **Rôles de Bénévolat**: Enter roles separated by commas (e.g., "Accueil, Sécurité")
   - **Statut du Bénévole**: Select "Actif"
   - **Date de Début**: Select a date
7. Click "Enregistrer le Profil"

**Expected Result:**
- Member is saved with `isVolunteer: true`
- Volunteer fields are stored in Firestore
- Member appears in `/volunteers` page

**Verify in Firestore:**
```javascript
// In Firebase Console → Firestore → members collection
// Find the member document and verify:
{
  isVolunteer: true,
  volunteerRoles: ["Accueil", "Sécurité"],
  volunteerDepartmentId: "dept-id-...",
  volunteerStatus: "Actif",
  volunteerStartDate: "2025-01-15"
}
```

---

### **Test 2: View Volunteers Page**

**Steps:**
1. Login as `admin@ncd.com`
2. Navigate to `/volunteers`
3. Verify volunteers are displayed

**Expected Result:**
- Page shows all members with `isVolunteer: true`
- Volunteers are grouped by department
- Each volunteer card shows:
  - Name and role
  - Volunteer roles (badges)
  - Status badge (Actif/Inactif/En pause)
  - Start date (if available)
  - Department name

---

### **Test 3: Filter Volunteers**

**Steps:**
1. On `/volunteers` page
2. Use "Filtrer par Statut" dropdown:
   - Select "Actif" → Should show only active volunteers
   - Select "Inactif" → Should show only inactive volunteers
   - Select "Tous" → Should show all volunteers
3. Use "Filtrer par Département" dropdown:
   - Select a specific department → Should show only volunteers in that department
   - Select "Tous" → Should show all volunteers

**Expected Result:**
- Filters work correctly
- Volunteer count updates based on filters
- Empty state shows if no volunteers match filters

---

### **Test 4: Update Volunteer Status**

**Steps:**
1. On `/volunteers` page
2. Click on a volunteer card (should navigate to members page)
3. Or go to `/members` and open the member
4. In the member form, scroll to "Bénévole" section
5. Change "Statut du Bénévole" to "Inactif"
6. Click "Enregistrer le Profil"

**Expected Result:**
- Status updates in Firestore
- Volunteer card on `/volunteers` page shows updated status
- Status badge color changes (green → gray)

---

### **Test 5: Remove Volunteer Status**

**Steps:**
1. Go to `/members`
2. Open a member who is a volunteer
3. In the "Bénévole" section, uncheck "Bénévole" checkbox
4. Click "Enregistrer le Profil"

**Expected Result:**
- `isVolunteer` is set to `false` or removed
- Member no longer appears on `/volunteers` page
- Other volunteer fields may remain but are ignored

---

## 🙏 Testing Prayer Requests (Requêtes de Prières)

### **Test 1: Submit a Public Prayer Request**

**Steps:**
1. Login as any user (or as a member)
2. Navigate to `/prayer-requests`
3. Click "Déposer une Requête"
4. Fill in the form:
   - **Votre Nom**: "Fr. Jean"
   - **Titre (optionnel)**: "Prière pour la santé"
   - **Catégorie**: Select "Santé"
   - **Votre Requête**: "Je demande la prière pour ma santé et celle de ma famille..."
   - **Requête Confidentielle**: Leave unchecked (public)
5. Click "Envoyer"

**Expected Result:**
- Request is saved to Firestore `/prayer_requests` collection
- Request appears on the page immediately (real-time sync)
- Request shows as "Public" badge
- Status is "En attente" (default)
- Date is displayed correctly

**Verify in Firestore:**
```javascript
// In Firebase Console → Firestore → prayer_requests collection
// Find the new document and verify:
{
  content: "Je demande la prière...",
  submittedBy: "Fr. Jean",
  isPrivate: false,
  status: "En attente",
  category: "Santé",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### **Test 2: Submit a Private Prayer Request**

**Steps:**
1. Navigate to `/prayer-requests`
2. Click "Déposer une Requête"
3. Fill in the form:
   - **Votre Nom**: "Sœur Marie"
   - **Votre Requête**: "Requête confidentielle pour ma famille..."
   - **Requête Confidentielle**: Check the checkbox
4. Click "Envoyer"

**Expected Result:**
- Request is saved with `isPrivate: true`
- Request shows "Confidentiel" badge
- If logged in as regular member: Only the requester can see the full content
- If logged in as PASTOR/SUPER_ADMIN: Can see full content

---

### **Test 3: View Prayer Requests (Different Roles)**

#### **As Regular Member:**
1. Login as a member (not PASTOR/SUPER_ADMIN)
2. Navigate to `/prayer-requests`
3. Verify:
   - Public requests are fully visible
   - Private requests show placeholder: "Cette requête est privée. Seuls les pasteurs et administrateurs peuvent voir le contenu."
   - Own private requests are visible

#### **As PASTOR/SUPER_ADMIN:**
1. Login as `admin@ncd.com` (or PASTOR role)
2. Navigate to `/prayer-requests`
3. Verify:
   - All requests (public and private) are fully visible
   - Status filter dropdown is visible
   - Status update dropdown is available on each request

---

### **Test 4: Update Prayer Request Status (Admin/Pastor)**

**Steps:**
1. Login as `admin@ncd.com`
2. Navigate to `/prayer-requests`
3. Find a request with status "En attente"
4. Use the status dropdown on the request card
5. Change status to "En cours"
6. Verify status updates immediately (real-time sync)

**Expected Result:**
- Status updates in Firestore
- Status badge color changes (yellow → blue)
- Status filter works correctly

**Test all statuses:**
- "En attente" → Yellow badge
- "En cours" → Blue badge
- "Exaucée" → Green badge
- "Archivée" → Gray badge

---

### **Test 5: Filter Prayer Requests by Status**

**Steps:**
1. Login as `admin@ncd.com`
2. Navigate to `/prayer-requests`
3. Use status filter buttons:
   - Click "En attente" → Should show only pending requests
   - Click "Exaucée" → Should show only answered requests
   - Click "Tous" → Should show all requests

**Expected Result:**
- Filter works correctly
- Request count updates
- Empty state shows if no requests match filter

---

### **Test 6: Delete Prayer Request**

**Steps:**
1. Login as `admin@ncd.com` (or as the request author)
2. Navigate to `/prayer-requests`
3. Find a request you created (or any request if admin)
4. Click "Supprimer" button
5. Confirm deletion

**Expected Result:**
- Request is deleted from Firestore
- Request disappears from the page immediately (real-time sync)
- Only author or admin/pastor can delete

---

### **Test 7: Generate AI Prayer**

**Steps:**
1. Navigate to `/prayer-requests`
2. Find a public request (or your own private request)
3. Click "Prier avec l'IA" button
4. Wait for AI generation

**Expected Result:**
- Modal opens with generated prayer
- Prayer is relevant to the request content
- Modal can be closed with "Amen" button

---

### **Test 8: Privacy Rules**

**Test Private Request Visibility:**

1. **As Regular Member:**
   - Submit a private request
   - Logout and login as another member
   - Navigate to `/prayer-requests`
   - Verify: Private request shows placeholder, not full content

2. **As PASTOR/SUPER_ADMIN:**
   - Login as `admin@ncd.com`
   - Navigate to `/prayer-requests`
   - Verify: All private requests are fully visible

3. **As Request Author:**
   - Submit a private request
   - Verify: Your own private request is fully visible to you

---

## 🔗 Integration Testing

### **Test 1: Volunteer → Member Link**

**Steps:**
1. Mark a member as volunteer (set `isVolunteer: true`)
2. Go to `/volunteers` page
3. Click on the volunteer card
4. Verify: Navigates to `/members` page with that member selected

**Expected Result:**
- Navigation works correctly
- Member detail shows volunteer information

---

### **Test 2: Prayer Request → Member Link**

**Steps:**
1. Submit a prayer request while logged in
2. Verify: `authorId` and `memberId` are set in Firestore
3. Go to member detail page
4. (Future enhancement: Show prayer requests linked to member)

**Expected Result:**
- `authorId` matches current user's Firebase Auth UID
- `memberId` is set if user is a member

---

## 🐛 Troubleshooting

### **Issue: Volunteers not showing on `/volunteers` page**

**Possible Causes:**
1. Members don't have `isVolunteer: true` set
2. Real-time listener not working
3. Firestore rules blocking read access

**Solutions:**
1. Check Firestore console: Verify `isVolunteer: true` on member documents
2. Check browser console for errors
3. Verify Firestore rules allow read access to `/members` collection

---

### **Issue: Prayer requests not appearing**

**Possible Causes:**
1. Firestore rules blocking read access
2. Real-time listener not working
3. Privacy filter hiding requests

**Solutions:**
1. Check Firestore console: Verify requests exist in `/prayer_requests` collection
2. Check browser console for errors
3. Verify user role has `VIEW_PRIVATE_PRAYERS` permission if viewing private requests
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`

---

### **Issue: "Missing or insufficient permissions" error**

**Possible Causes:**
1. Firestore rules not deployed
2. User role doesn't have required permissions
3. Collection name mismatch (`prayer_requests` vs `prayerRequests`)

**Solutions:**
1. Deploy Firestore rules: `firebase deploy --only firestore:rules --project ncd-admin-app`
2. Verify user role in Firebase Console → Authentication → Users
3. Check collection name matches in `firestore.rules` (should be `prayer_requests`)

---

### **Issue: Volunteer fields not saving**

**Possible Causes:**
1. Form validation failing
2. `updateMember` function not working
3. Firestore rules blocking write access

**Solutions:**
1. Check browser console for validation errors
2. Verify `updateMember` is called in `MemberDrawer`
3. Check Firestore rules allow write access to `/members` collection

---

## ✅ Testing Checklist

### **Volunteers Module:**
- [ ] Mark member as volunteer
- [ ] View volunteers page
- [ ] Filter by status
- [ ] Filter by department
- [ ] Update volunteer status
- [ ] Remove volunteer status
- [ ] Navigate from volunteer to member detail

### **Prayer Requests Module:**
- [ ] Submit public prayer request
- [ ] Submit private prayer request
- [ ] View requests as regular member
- [ ] View requests as PASTOR/SUPER_ADMIN
- [ ] Update request status (admin)
- [ ] Filter by status
- [ ] Delete request (author/admin)
- [ ] Generate AI prayer
- [ ] Privacy rules work correctly

### **Integration:**
- [ ] Volunteer → Member link works
- [ ] Prayer request → Member link works (authorId/memberId set)
- [ ] Real-time sync works for both modules

---

## 📝 Notes

1. **Real-time Sync**: Both modules use Firestore `onSnapshot` listeners, so changes should appear immediately without page refresh.

2. **Privacy**: Private prayer requests are filtered client-side based on user permissions. Firestore rules provide additional server-side security.

3. **Volunteer Data**: Volunteer information is stored on the `Member` document, not in a separate collection. This keeps data normalized and makes it easy to see volunteer status when viewing member details.

4. **Prayer Request Status**: Status management is only available to users with `VIEW_PRIVATE_PRAYERS` permission (PASTOR, SUPER_ADMIN, etc.).

5. **Future Enhancements:**
   - Show prayer requests on member detail page
   - Add prayer request analytics
   - Add volunteer scheduling/assignments
   - Add volunteer performance tracking

---

## 🎉 Success Criteria

All tests pass when:
- ✅ Volunteers can be marked, viewed, filtered, and updated
- ✅ Prayer requests can be submitted, viewed, filtered, and managed
- ✅ Privacy rules work correctly for different user roles
- ✅ Real-time sync works for both modules
- ✅ No console errors or Firestore permission errors

---

**End of Testing Guide**
