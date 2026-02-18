# Departments Module Testing Guide

## Prerequisites

1. **Firebase Setup**: Ensure your Firebase project is configured with:
   - Firestore database initialized
   - Security rules deployed (see `firestore.rules`)
   - Authentication enabled

2. **User Account**: Login as `admin@ncd.com` (SUPER_ADMIN role) for full access

3. **Development Server**: Run `npm run dev` and navigate to `http://localhost:3000`

---

## Test Checklist

### ✅ 1. View Departments List

**Steps:**
1. Navigate to `/departments` (or click "Pôles" in navigation)
2. Verify the page loads without errors
3. Check that all departments are displayed in a grid layout

**Expected Results:**
- ✅ Page title: "Hub des 29 Départements"
- ✅ Category filter sidebar on the left (Tous, Spiritualité, Culte, etc.)
- ✅ Department cards displayed in grid (2 columns on desktop)
- ✅ Each card shows:
  - Department number (#1, #2, etc.)
  - Department name
  - Meeting schedule (days + time)
  - Leader name (Titulaire)
  - VP name (if exists)
  - Member count (Effectif)
  - Report status indicator (green dot = À jour, red dot = En retard)
- ✅ "Réunion" badge appears on cards if department meets today

**If Empty State:**
- ✅ Shows "Aucun département enregistré" message
- ✅ Shows "Créer un Pôle" button (if you have MANAGE_DEPARTMENTS permission)

---

### ✅ 2. Filter Departments by Category

**Steps:**
1. Click on a category in the sidebar (e.g., "Spiritualité")
2. Verify the grid updates to show only departments in that category
3. Click "Tous" to show all departments again

**Expected Results:**
- ✅ Grid updates immediately when category is clicked
- ✅ Category badge shows count of departments in that category
- ✅ Active category is highlighted (primary color)
- ✅ "Tous" shows total count of all departments

---

### ✅ 3. Create a New Department

**Steps:**
1. Click "Créer un Pôle" button (top right)
2. Fill in the form:
   - **Nom**: "Test Département"
   - **Code**: "TEST" (optional)
   - **Catégorie**: Select "Technique"
   - **Jours de Réunion**: Click "Lundi" and "Jeudi" buttons
   - **Heure**: "17h00"
   - **Description**: "Département de test pour validation"
3. Click "Créer le Pôle"

**Expected Results:**
- ✅ Modal opens with form
- ✅ Day buttons toggle correctly (highlight when selected)
- ✅ Form validation works (name is required)
- ✅ After submission:
  - Modal closes
  - New department appears in the grid immediately
  - Department has next available number
  - Member count shows 0
  - Report status shows "À jour"

**Verify in Firestore:**
- Open Firebase Console → Firestore → `departments` collection
- Find document with name "Test Département"
- Verify all fields are saved correctly:
  - `name`: "Test Département"
  - `code`: "TEST"
  - `category`: "Technique"
  - `meetingDays`: ["Lundi", "Jeudi"]
  - `meetingTime`: "17h00"
  - `description`: "Département de test pour validation"
  - `memberCount`: 0
  - `reportStatus`: "À jour"

---

### ✅ 4. View Department Detail (Hub)

**Steps:**
1. Click on any department card
2. Verify the DepartmentDashboard modal opens

**Expected Results:**
- ✅ Modal opens with department name in title
- ✅ Four tabs visible: "Vue d'ensemble", "Membres", "Rapports", "Paramètres"
- ✅ Overview tab shows:
  - 4 stat cards: Effectif, Réunion, Status, Archivés
  - Leadership section with leader names and roles
- ✅ Members tab shows list of members (or empty state)
- ✅ Reports tab shows report submission form and existing reports
- ✅ Settings tab visible (if you have MANAGE_DEPARTMENTS permission)

---

### ✅ 5. Edit Department Settings

**Steps:**
1. Open a department's detail view
2. Click "Paramètres" tab
3. Make changes:
   - Change name to "Test Département Modifié"
   - Add description: "Description modifiée"
   - Select different meeting days (e.g., "Mardi", "Vendredi")
   - Change meeting time to "18h00"
   - Select a different leader from dropdown
4. Click "Enregistrer"

**Expected Results:**
- ✅ Form fields are pre-populated with current values
- ✅ Day buttons show current selection
- ✅ Dropdowns show all members
- ✅ After saving:
  - Success message appears
  - Changes are reflected immediately in the UI
  - Department card updates when modal is closed
  - Member count is updated dynamically

**Verify in Firestore:**
- Check Firestore document - all changes should be saved
- `name`: "Test Département Modifié"
- `meetingDays`: ["Mardi", "Vendredi"]
- `meetingTime`: "18h00"
- `leaderId`: Selected member's ID

---

### ✅ 6. Link Members to Department

**Steps:**
1. Navigate to `/members`
2. Open a member's detail drawer
3. In the department selection, assign the member to "Test Département"
4. Save the member
5. Go back to `/departments`
6. Open "Test Département" detail view
7. Check "Membres" tab

**Expected Results:**
- ✅ Member appears in the department's member list
- ✅ Member count in Overview tab increases
- ✅ Member count on department card updates
- ✅ Member card shows:
  - Name
  - Role
  - Church function (if assigned)
  - Leader badge (if `isLeader` is true)

**Verify Relationship:**
- Check member document in Firestore:
  - `departmentIds` array includes department ID
  - OR `primaryDepartmentId` equals department ID

---

### ✅ 7. Submit a Monthly Report

**Steps:**
1. Open a department's detail view
2. Click "Rapports" tab
3. Click "Choisir un fichier" area
4. Select a file (PDF, DOC, or image)
5. Click "Envoyer"

**Expected Results:**
- ✅ File selection works
- ✅ Selected file name is displayed
- ✅ After submission:
  - File input clears
  - Tab switches to "Rapports" (if not already there)
  - New report appears in the list
  - Report shows:
    - Current month and year
    - File name
    - Status: "En attente"
  - Report count in Overview tab increases

**Verify in Firestore:**
- Check `departmentReports` collection
- New document should exist with:
  - `departmentId`: Department's ID
  - `month`: Current month name (French)
  - `year`: Current year
  - `status`: "En attente"
  - `fileName`: Selected file name
  - `submittedAt`: Today's date (ISO format)

---

### ✅ 8. Approve a Report

**Steps:**
1. Open a department with a pending report
2. Go to "Rapports" tab
3. Find a report with status "En attente"
4. Click "Approuver" button

**Expected Results:**
- ✅ Button is only visible for pending reports
- ✅ After clicking:
  - Report status changes to "Approuvé"
  - Badge updates to green/success color
  - "Approuver" button disappears

**Verify in Firestore:**
- Check report document
- `status` field should be "Approuvé"

---

### ✅ 9. Delete Department (Safety Check)

**Steps:**
1. Open a department's detail view
2. Go to "Paramètres" tab
3. Scroll to "Zone Danger"
4. Click "Supprimer le Département"
5. Read the confirmation dialog

**Expected Results:**
- ✅ Warning dialog appears with:
  - Message about irreversible deletion
  - Count of assigned members (if any)
  - Count of associated reports (if any)
- ✅ If department has members or reports:
  - Warning clearly shows counts
  - User must confirm explicitly
- ✅ If confirmed:
  - Department is deleted
  - Modal closes
  - Department disappears from list
  - Firestore document is deleted

**Test Safety:**
- Try deleting a department with members assigned
- Verify warning shows member count
- Cancel deletion - department should remain
- Confirm deletion - department should be removed

**Note**: Reports are NOT automatically deleted when department is deleted. They remain in `departmentReports` collection with `departmentId` reference (orphaned reports).

---

### ✅ 10. Loading States

**Steps:**
1. Refresh the page while on `/departments`
2. Observe loading behavior

**Expected Results:**
- ✅ Loading skeletons appear while departments load
- ✅ Empty state appears if no departments exist
- ✅ No blank/white screen during loading

---

### ✅ 11. Empty States

**Steps:**
1. Filter to a category with no departments
2. Or create a new department with no members
3. Open department detail → "Membres" tab

**Expected Results:**
- ✅ Helpful empty state messages appear
- ✅ Empty states include:
  - Icon or visual indicator
  - Descriptive text
  - Action button (if applicable)

---

### ✅ 12. Real-time Updates

**Steps:**
1. Open `/departments` in two browser windows/tabs
2. In Tab 1: Create a new department
3. In Tab 2: Observe

**Expected Results:**
- ✅ Tab 2 updates automatically (no refresh needed)
- ✅ New department appears in Tab 2's list
- ✅ Same behavior for edits and deletions

---

## Common Issues & Troubleshooting

### Issue: Departments not loading
**Solution:**
- Check browser console for errors
- Verify Firestore security rules allow read access
- Check Firebase connection in Network tab
- Verify `departments` collection exists in Firestore

### Issue: Cannot create department
**Solution:**
- Verify you're logged in as `admin@ncd.com` or user with `MANAGE_DEPARTMENTS` permission
- Check Firestore security rules allow create access
- Check browser console for error messages
- Verify all required fields are filled

### Issue: Member count not updating
**Solution:**
- Member count is calculated dynamically from `members` collection
- Verify member has `departmentIds` array or `primaryDepartmentId` set
- Check that member's department ID matches department's ID exactly
- Refresh page to force recalculation

### Issue: Reports not submitting
**Solution:**
- Check Firestore security rules for `departmentReports` collection
- Verify file size is reasonable (not too large)
- Check browser console for errors
- Verify you're authenticated

### Issue: Cannot approve reports
**Solution:**
- Verify you have `MANAGE_DEPARTMENTS` permission
- Check that report status is "En attente"
- Verify Firestore security rules allow update access

---

## Performance Testing

### Large Dataset:
- Test with 50+ departments
- Test with departments having 100+ members
- Test with 100+ reports per department

**Expected:**
- ✅ List loads smoothly
- ✅ Filtering is fast
- ✅ Modal opens quickly
- ✅ No lag when scrolling

---

## Security Testing

### Permission Checks:
1. Login as different roles (VIEWER, MEMBER, VOLUNTEER)
2. Try to create/edit/delete departments

**Expected:**
- ✅ Only users with `MANAGE_DEPARTMENTS` can create/edit/delete
- ✅ Other users can view departments and reports
- ✅ Security rules enforce permissions at Firestore level

---

## Browser Compatibility

Test on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Summary

After completing all tests, the Departments module should:
- ✅ Display all departments correctly
- ✅ Allow creating new departments with all fields
- ✅ Allow editing department settings
- ✅ Show members linked to departments
- ✅ Allow submitting and approving reports
- ✅ Prevent accidental deletion with safety checks
- ✅ Update in real-time across multiple tabs
- ✅ Handle loading and empty states gracefully
- ✅ Enforce proper permissions and security

If all tests pass, the Departments module is ready for production use! 🎉
