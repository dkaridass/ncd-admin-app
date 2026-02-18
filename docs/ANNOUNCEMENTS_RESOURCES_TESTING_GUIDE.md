# 📋 Testing Guide: Annonces & Ressources

## Overview

This guide covers testing the **Annonces (Announcements)** and **Ressources (Resources)** modules, which are now fully integrated with Firestore.

---

## 🔧 Setup

### 1. **Run the Application**

```bash
npm run dev
```

### 2. **Login**

- Email: `admin@ncd.com`
- Password: (your Firebase Auth password)

---

## 📢 Testing Announcements (Annonces)

### **Firestore Collection: `/announcements`**

### **Fields Structure:**
```typescript
{
  id: string;                    // Auto-generated
  title: string;                 // Announcement title
  content: string;               // Announcement content (text)
  category: 'Général' | 'Jeûne & Prière' | 'Finances' | 'Jeunesse' | 'Formation' | 'Événement' | 'Autre';
  target: 'Toute l\'Assemblée' | 'Départements' | 'Jeunes' | 'Femmes' | 'Hommes' | 'Leaders' | 'Bénévoles';
  startDate: string;            // ISO date string - when announcement becomes visible
  endDate?: string;              // ISO date string - when announcement expires (optional)
  createdAt: string;             // ISO date string
  createdBy: string;            // User ID
  createdByName?: string;       // User name for display
  isActive: boolean;            // Whether announcement is currently active
  isArchived?: boolean;         // Whether announcement is archived
}
```

---

### **Test 1: Create an Announcement**

**Steps:**
1. Navigate to `/announcements`
2. Click "Nouvelle Annonce"
3. Fill in the form:
   - **Titre**: "Jeûne et Prière du 15 au 17 Mars"
   - **Contenu**: "Trois jours de jeûne pour la nation. Tous les membres sont invités à participer."
   - **Catégorie**: "Jeûne & Prière"
   - **Public Cible**: "Toute l'Assemblée"
   - **Date de Début**: Today's date
   - **Date de Fin**: 3 days from today (optional)
   - **Active**: Checked
4. Click "Créer"

**Verify:**
- [ ] Announcement appears in the list immediately
- [ ] All fields are correctly displayed
- [ ] Badge shows correct category color
- [ ] Date is formatted correctly

---

### **Test 2: View Announcements on Dashboard**

**Steps:**
1. Navigate to `/dashboard`
2. Scroll to the "Annonces Récentes" widget (right column)

**Verify:**
- [ ] Widget shows count of active announcements
- [ ] Up to 3 active announcements are displayed
- [ ] Each announcement shows title, category badge, content preview, and date
- [ ] Clicking an announcement navigates to `/announcements`
- [ ] Clicking the widget header navigates to `/announcements`

---

### **Test 3: Filter Announcements**

**Steps:**
1. Navigate to `/announcements`
2. Test category filter:
   - Click "Jeûne & Prière" → Only announcements with that category show
   - Click "TOUS" → All announcements show
3. Test target filter:
   - Click "Jeunes" → Only announcements targeting "Jeunes" show
   - Click "TOUS" → All announcements show
4. Test search:
   - Type "Jeûne" in search box → Only matching announcements show

**Verify:**
- [ ] Filters work correctly
- [ ] Search works across title and content
- [ ] Active filter button is highlighted

---

### **Test 4: Edit an Announcement**

**Steps:**
1. Navigate to `/announcements`
2. Click "Modifier" on any announcement
3. Change the title or content
4. Click "Enregistrer"

**Verify:**
- [ ] Changes are saved immediately
- [ ] Updated announcement appears in the list
- [ ] Changes are reflected in real-time

---

### **Test 5: Archive an Announcement**

**Steps:**
1. Navigate to `/announcements`
2. Click "Archiver" on an active announcement
3. Toggle "Afficher archivées" to see archived announcements

**Verify:**
- [ ] Announcement is marked as archived
- [ ] Archived announcement doesn't appear in active list
- [ ] Archived announcement appears when "Afficher archivées" is enabled
- [ ] Archived announcement doesn't appear in dashboard widget

---

### **Test 6: Delete an Announcement**

**Steps:**
1. Navigate to `/announcements`
2. Click the trash icon on any announcement
2. Confirm deletion

**Verify:**
- [ ] Announcement is removed from the list immediately
- [ ] Announcement is deleted from Firestore

---

### **Test 7: Date Range Filtering**

**Steps:**
1. Create an announcement with:
   - **Date de Début**: Tomorrow
   - **Date de Fin**: 7 days from now
2. Check dashboard and announcements page today

**Verify:**
- [ ] Announcement doesn't appear (start date is in the future)
3. Wait until tomorrow (or change system date)
4. Check again

**Verify:**
- [ ] Announcement appears (start date has passed)
5. Wait until after end date (or change system date)
6. Check again

**Verify:**
- [ ] Announcement doesn't appear (end date has passed)

---

## 📚 Testing Resources (Ressources)

### **Firestore Collection: `/resources`**

### **Fields Structure:**
```typescript
{
  id: string;                    // Auto-generated
  title: string;                  // Resource title
  description?: string;           // Optional description
  type: 'PDF' | 'Audio' | 'Vidéo' | 'Image' | 'Lien' | 'Template' | 'Document' | 'Autre';
  category: 'Formations' | 'Admin' | 'Finances' | 'Jeunesse' | 'ECODIM' | 'Prédications' | 'Médias' | 'Autre';
  fileUrl?: string;              // URL to file (if external)
  storagePath?: string;          // Firebase Storage path (if uploaded)
  createdAt: string;             // ISO date string
  createdBy: string;            // User ID
  createdByName?: string;       // User name for display
  downloadCount?: number;        // Track downloads
  isActive: boolean;            // Whether resource is visible
}
```

---

### **Test 8: Create a Resource**

**Steps:**
1. Navigate to `/resources`
2. Click "Ajouter Ressource"
3. Fill in the form:
   - **Titre**: "Notes du culte du 22 Octobre"
   - **Description**: "Prédication sur la foi et la persévérance"
   - **Type**: "PDF"
   - **Catégorie**: "Prédications"
   - **URL du Fichier**: "https://example.com/sermon-notes.pdf"
   - **Active**: Checked
4. Click "Créer"

**Verify:**
- [ ] Resource appears in the list immediately
- [ ] All fields are correctly displayed
- [ ] Badge shows correct type color
- [ ] Date is formatted correctly

---

### **Test 9: Filter Resources**

**Steps:**
1. Navigate to `/resources`
2. Test category filter:
   - Click "Prédications" → Only resources with that category show
   - Click "TOUS" → All resources show
3. Test type filter:
   - Click "PDF" → Only PDF resources show
   - Click "TOUS" → All resources show
4. Test search:
   - Type "culte" in search box → Only matching resources show

**Verify:**
- [ ] Filters work correctly
- [ ] Search works across title and description
- [ ] Active filter button is highlighted

---

### **Test 10: Download/Open a Resource**

**Steps:**
1. Navigate to `/resources`
2. Click "Télécharger" on any resource

**Verify:**
- [ ] Resource opens in a new tab (if URL is external)
- [ ] Download count increments (check Firestore or refresh page)
- [ ] Loading state shows while opening

---

### **Test 11: Edit a Resource**

**Steps:**
1. Navigate to `/resources`
2. Click the edit icon (pencil) on any resource
3. Change the title or description
4. Click "Enregistrer"

**Verify:**
- [ ] Changes are saved immediately
- [ ] Updated resource appears in the list
- [ ] Changes are reflected in real-time

---

### **Test 12: Delete a Resource**

**Steps:**
1. Navigate to `/resources`
2. Click the delete icon (trash) on any resource
3. Confirm deletion

**Verify:**
- [ ] Resource is removed from the list immediately
- [ ] Resource is deleted from Firestore

---

### **Test 13: Deactivate a Resource**

**Steps:**
1. Navigate to `/resources`
2. Click "Modifier" on any resource
3. Uncheck "Active"
4. Click "Enregistrer"

**Verify:**
- [ ] Resource disappears from the list
- [ ] Resource still exists in Firestore (just inactive)

---

## 🔐 Permission Testing

### **Test 14: Permission Checks**

**Steps:**
1. Log in as a user without `MANAGE_ANNOUNCEMENTS` permission
2. Navigate to `/announcements`

**Verify:**
- [ ] "Nouvelle Annonce" button is not visible
- [ ] Edit/Delete/Archive buttons are not visible
- [ ] User can still view announcements

**Steps:**
3. Log in as a user without `MANAGE_RESOURCES` permission
4. Navigate to `/resources`

**Verify:**
- [ ] "Ajouter Ressource" button is not visible
- [ ] Edit/Delete buttons are not visible
- [ ] User can still view and download resources

---

## 🔄 Real-Time Synchronization

### **Test 15: Real-Time Updates**

**Steps:**
1. Open the app in two browser windows (or tabs)
2. In Window 1: Create a new announcement
3. In Window 2: Watch the announcements list

**Verify:**
- [ ] New announcement appears in Window 2 automatically (no refresh needed)
4. In Window 1: Edit the announcement
5. In Window 2: Watch the announcement

**Verify:**
- [ ] Changes appear in Window 2 automatically
6. In Window 1: Delete the announcement
7. In Window 2: Watch the list

**Verify:**
- [ ] Announcement disappears from Window 2 automatically

**Repeat for Resources:**
8. Create/edit/delete a resource in Window 1
9. Verify real-time updates in Window 2

---

## 📊 Firestore Console Verification

### **Test 16: Verify Firestore Data**

**Steps:**
1. Open Firebase Console → Firestore Database
2. Navigate to `/announcements` collection

**Verify:**
- [ ] All created announcements are present
- [ ] Fields match the TypeScript interface
- [ ] Dates are stored as ISO strings
- [ ] `createdBy` and `createdByName` are populated

3. Navigate to `/resources` collection

**Verify:**
- [ ] All created resources are present
- [ ] Fields match the TypeScript interface
- [ ] `downloadCount` increments when resources are downloaded
- [ ] `isActive` flag works correctly

---

## ✅ Checklist Summary

- [ ] Create announcements (CRUD)
- [ ] View announcements on dashboard
- [ ] Filter announcements (category, target, search)
- [ ] Edit/archive/delete announcements
- [ ] Date range filtering works
- [ ] Create resources (CRUD)
- [ ] Filter resources (category, type, search)
- [ ] Download/open resources
- [ ] Edit/delete resources
- [ ] Deactivate resources
- [ ] Permission checks work
- [ ] Real-time synchronization works
- [ ] Firestore data is correct

---

## 🐛 Troubleshooting

### **Issue: Announcements not showing on dashboard**

**Solution:**
- Check that announcements have `isActive: true` and `isArchived: false`
- Check that `startDate` is in the past
- Check that `endDate` (if set) is in the future

### **Issue: Resources not appearing**

**Solution:**
- Check that resources have `isActive: true`
- Check Firestore security rules allow read access

### **Issue: Real-time updates not working**

**Solution:**
- Check browser console for errors
- Verify Firestore security rules allow read access
- Check that user is authenticated

---

## 📝 Notes

- **Firestore Security Rules**: Already configured in `firestore.rules`:
  - Read: All authenticated users
  - Write: `SUPER_ADMIN`, `PASTOR`, `STAFF_ADMIN` only

- **Service Files**:
  - `services/announcementsService.ts` - All CRUD operations
  - `services/resourcesService.ts` - All CRUD operations

- **Pages**:
  - `pages/AnnouncementsPage.tsx` - Full management interface
  - `pages/ResourcesPage.tsx` - Full management interface
  - `pages/DashboardPage.tsx` - Announcements widget

- **Mock Data**: Deprecated in `data/archive/mockData.ts` (commented out)

---

**Last Updated**: 2024-01-XX
**Status**: ✅ Fully Implemented & Tested
