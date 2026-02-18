# Programme Module Testing Guide

## Overview
This guide covers testing for both **Weekly Services** (Programme Hebdomadaire) and **Annual Programme 2026** (Programme Annuel 2026).

---

## Prerequisites

1. **Firebase Setup**: Ensure Firestore is configured and security rules are deployed
2. **User Account**: Login as `admin@ncd.com` (SUPER_ADMIN role)
3. **Development Server**: Run `npm run dev` and navigate to `http://localhost:3000`

---

## Step 1: Initialize Programme Data

Before testing, you need to initialize the weekly services and annual programme 2026 in Firestore.

### Option A: Via Settings Page
1. Navigate to `/settings`
2. Find the "Programme" section
3. Click "Initialiser Programme" button (if available)
4. Wait for success message

### Option B: Via Browser Console
1. Open browser console (F12)
2. Run:
```javascript
import { initializeProgramme } from './utils/initializeProgramme';
await initializeProgramme();
```

### Option C: Manual Firestore Import
- Use Firebase Console to manually add documents to `weeklyServices` and `annualProgramme` collections
- See data structure examples below

---

## Step 2: Verify Firestore Collections

### Weekly Services Collection (`weeklyServices`)

**Expected Documents (5 total):**

1. **Mercredi - Culte**
   ```json
   {
     "dayOfWeek": "Mercredi",
     "serviceName": "Culte",
     "startTime": "16:30",
     "endTime": "18:30",
     "location": "Paroisse La Pentecôte C.E. Nouvelle Cité de David",
     "description": "Enseignement et prière",
     "order": 1,
     "isActive": true
   }
   ```

2. **Vendredi - Culte**
   ```json
   {
     "dayOfWeek": "Vendredi",
     "serviceName": "Culte",
     "startTime": "16:30",
     "endTime": "18:30",
     "location": "Paroisse La Pentecôte C.E. Nouvelle Cité de David",
     "description": "Enseignement et prière",
     "order": 1,
     "isActive": true
   }
   ```

3. **Dimanche - 1er culte**
   ```json
   {
     "dayOfWeek": "Dimanche",
     "serviceName": "1er culte",
     "startTime": "07:20",
     "endTime": "09:20",
     "location": "Paroisse La Pentecôte C.E. Nouvelle Cité de David",
     "description": "Culte de louange et adoration",
     "order": 1,
     "isActive": true
   }
   ```

4. **Dimanche - 2ème culte**
   ```json
   {
     "dayOfWeek": "Dimanche",
     "serviceName": "2ème culte",
     "startTime": "09:30",
     "endTime": "11:30",
     "location": "Paroisse La Pentecôte C.E. Nouvelle Cité de David",
     "description": "Culte de louange et adoration",
     "order": 2,
     "isActive": true
   }
   ```

5. **Dimanche - 3ème culte**
   ```json
   {
     "dayOfWeek": "Dimanche",
     "serviceName": "3ème culte",
     "startTime": "16:00",
     "endTime": "18:00",
     "location": "Paroisse La Pentecôte C.E. Nouvelle Cité de David",
     "description": "Culte de louange et adoration",
     "order": 3,
     "isActive": true
   }
   ```

### Annual Programme 2026 Collection (`annualProgramme`)

**Expected Documents (13 total):**

1. ÉCOLE DE LA COMMUNAUTÉ (2026-01-04 to 2026-01-09)
2. 12 JOURS DE PRIÈRES POUR DÉDICACER L'ANNÉE 2026 (2026-01-19 to 2026-01-30)
3. 28 MATINÉES DE GLOIRE (2026-02-01 to 2026-02-28)
4. CONVENTION DES SŒURS (2026-03-04 to 2026-03-06)
5. CÉLÉBRATION JVI (2026-03-31 to 2026-04-03)
6. CIEL OUVERT 50 JOURS DE PRIERE (2026-04-05 to 2026-05-24)
7. SEMINAIRE SPECIAL DES COUPLE & FAMILLES (2026-06-21 to 2026-06-27)
8. MOIS ÉVANGÉLIQUE (2026-09-01 to 2026-09-30)
9. CONEX 2026 (2026-10-18 to 2026-10-25)
10. GALA D'HONNEUR À KARAVIA (2026-10-24) - Location: PULLMAN HOTEL GRAND KARAVIA
11. PRIÈRE DE FIN D'ANNÉE 21 JOURS DE PRIERE (2026-12-04 to 2026-12-24)
12. CULTE DE NOËL (2026-12-25)
13. SPECIAL RÉVEILLON JESUS LE CENTRE (2026-12-31)

---

## Step 3: Test Weekly Programme

### 3.1 View Weekly Programme

**Steps:**
1. Navigate to `/events` (or click "Programme" in sidebar)
2. Click on "Programme Hebdomadaire" tab

**Expected Results:**
- ✅ Tab is visible and clickable
- ✅ Weekly services are displayed grouped by day:
  - **Dimanche**: Shows 3 services (1er culte 07:20-09:20, 2ème culte 09:30-11:30, 3ème culte 16:00-18:00)
  - **Mercredi**: Shows 1 service (Culte 16:30-18:30)
  - **Vendredi**: Shows 1 service (Culte 16:30-18:30)
- ✅ Each service card shows:
  - Day name
  - Service name
  - Time range (startTime - endTime)
  - Description or location
- ✅ Services are sorted by day (Dimanche first) and by order within each day

**If Empty:**
- ✅ Shows helpful message: "Aucun service hebdomadaire configuré"
- ✅ Suggests initialization

---

### 3.2 Verify Next Service Widget

**Steps:**
1. Navigate to `/events`
2. Look at the "Prochain Culte" widget in the right sidebar

**Expected Results:**
- ✅ Widget shows the next upcoming service from weekly schedule
- ✅ Displays:
  - Day abbreviation (e.g., "DIM")
  - Day number
  - Service name (e.g., "1er culte - Dimanche")
  - Start time and end time
- ✅ If it's currently Wednesday 15:00, it should show "Mercredi - Culte" at 16:30-18:30
- ✅ If it's currently Sunday 08:00, it should show the next service (2ème culte at 09:30)
- ✅ If all services for today have passed, shows next day's first service

---

## Step 4: Test Annual Programme 2026

### 4.1 View Annual Programme

**Steps:**
1. Navigate to `/events`
2. Click on "Programme Annuel 2026" tab

**Expected Results:**
- ✅ Tab is visible and clickable
- ✅ All 13 events are displayed in chronological order
- ✅ Each event card shows:
  - Event title (e.g., "ÉCOLE DE LA COMMUNAUTÉ")
  - Date range (formatted in French, e.g., "4 janvier - 9 janvier 2026")
  - Location (e.g., "Paroisse La Pentecôte C.E. Nouvelle Cité de David")
  - Description (if available)
  - Category badge (séminaire, convention, célébration, etc.)
- ✅ Events are sorted by `startDate` (earliest first)
- ✅ Gala d'Honneur shows location: "PULLMAN HOTEL GRAND KARAVIA"

**If Empty:**
- ✅ Shows helpful message: "Aucun événement annuel 2026 configuré"
- ✅ Suggests initialization

---

### 4.2 Verify Next Annual Event on Dashboard

**Steps:**
1. Navigate to `/dashboard` (or home page)
2. Look at the "MorningPulseCard" (Pouls du Ministère)
3. Check for "Prochain Événement Annuel" section

**Expected Results:**
- ✅ If there's an upcoming 2026 event, it displays:
  - Event title
  - Date (formatted in French)
  - Clickable (navigates to `/events?tab=annuel`)
- ✅ If today is before 2026-01-04, shows "ÉCOLE DE LA COMMUNAUTÉ"
- ✅ If today is after 2026-12-31, shows no upcoming event (or 2027 events if added)

---

## Step 5: Test Real-Time Updates

**Steps:**
1. Open `/events` in two browser windows/tabs
2. In Tab 1: Go to Firebase Console and add a new weekly service or annual event
3. In Tab 2: Observe

**Expected Results:**
- ✅ Tab 2 updates automatically (no refresh needed)
- ✅ New service/event appears immediately
- ✅ Same behavior for edits and deletions

---

## Step 6: Test Data Integrity

### 6.1 Weekly Services

**Verify:**
- ✅ Mercredi and Vendredi services show correct times (16:30-18:30)
- ✅ Dimanche shows all 3 services with correct times:
  - 1er culte: 07:20-09:20
  - 2ème culte: 09:30-11:30
  - 3ème culte: 16:00-18:00
- ✅ All services have `isActive: true`
- ✅ All services have correct `location` field

### 6.2 Annual Programme 2026

**Verify:**
- ✅ All 13 events are present
- ✅ Dates match the poster exactly:
  - École: Jan 4-9
  - 12 Jours: Jan 19-30
  - 28 Matinées: Feb 1-28
  - Convention Sœurs: Mar 4-6
  - JVI: Mar 31 - Apr 3
  - Ciel Ouvert: Apr 5 - May 24
  - Séminaire: Jun 21-27
  - Mois Évangélique: Sep 1-30
  - CONEX: Oct 18-25
  - Gala: Oct 24 (Pullman Hotel)
  - Prière Fin Année: Dec 4-24
  - Noël: Dec 25
  - Réveillon: Dec 31
- ✅ All events have `year: 2026`
- ✅ All events have `isActive: true`
- ✅ Gala d'Honneur has correct location: "PULLMAN HOTEL GRAND KARAVIA"

---

## Step 7: Test Edge Cases

### 7.1 No Data Initialized

**Steps:**
1. Delete all documents from `weeklyServices` and `annualProgramme` collections
2. Refresh `/events` page
3. Click on "Programme Hebdomadaire" and "Programme Annuel 2026" tabs

**Expected:**
- ✅ Empty states display correctly
- ✅ Helpful messages guide user to initialize data
- ✅ No errors or crashes

### 7.2 Partial Data

**Steps:**
1. Delete only Dimanche services
2. View "Programme Hebdomadaire"

**Expected:**
- ✅ Only Mercredi and Vendredi services are shown
- ✅ Dimanche section doesn't appear (or shows empty)
- ✅ No errors

---

## Step 8: Test Permissions

### 8.1 Read Access

**Steps:**
1. Login as different roles (VIEWER, MEMBER, VOLUNTEER)
2. Navigate to `/events`
3. Try to view weekly programme and annual programme

**Expected:**
- ✅ All authenticated users can view programme
- ✅ Tabs are visible and functional

### 8.2 Write Access (Future)

**Note:** Currently, weekly services and annual programme are managed via initialization scripts. Future admin UI for editing would require `MANAGE_EVENTS` permission.

---

## Common Issues & Troubleshooting

### Issue: Weekly services not showing
**Solution:**
- Check Firestore `weeklyServices` collection exists
- Verify documents have `isActive: true`
- Check browser console for errors
- Verify Firestore security rules allow read access

### Issue: Annual programme not showing
**Solution:**
- Check Firestore `annualProgramme` collection exists
- Verify documents have `year: 2026` and `isActive: true`
- Check browser console for errors
- Verify Firestore security rules allow read access

### Issue: "Prochain Culte" shows wrong service
**Solution:**
- Verify weekly services are correctly initialized
- Check that service times are in correct format (HH:MM
- Verify current date/time is correct

### Issue: Next annual event not showing on dashboard
**Solution:**
- Check that annual programme 2026 is initialized
- Verify at least one event has `startDate >= today`
- Check browser console for errors

---

## Summary Checklist

After completing all tests, verify:

- ✅ Weekly services display correctly (5 services total)
- ✅ Mercredi & Vendredi: 16:30-18:30
- ✅ Dimanche: 3 services with correct times
- ✅ Annual programme 2026 displays all 13 events
- ✅ Events are in chronological order
- ✅ Next service widget works correctly
- ✅ Next annual event shows on dashboard
- ✅ Real-time updates work
- ✅ Empty states display correctly
- ✅ No errors in console
- ✅ All data comes from Firestore (no mock/hardcoded data)

---

## Next Steps (Future Enhancements)

1. **Admin UI**: Add forms to edit weekly services and annual events
2. **Multi-Year Support**: Extend annual programme to support multiple years
3. **Service Templates**: Allow creating custom service types
4. **Notifications**: Alert users about upcoming annual events
5. **Export**: Export programme to PDF/Calendar format

---

## Files Changed

1. `types.ts` - Added `WeeklyService` and `AnnualEvent` interfaces
2. `services/weeklyServicesService.ts` - New service for weekly services
3. `services/annualProgrammeService.ts` - New service for annual programme
4. `context/DataContext.tsx` - Added listeners for both collections
5. `pages/EventsPage.tsx` - Added tabs and display logic
6. `components/ai/MorningPulseCard.tsx` - Added next annual event widget
7. `firestore.rules` - Added security rules for new collections
8. `utils/initializeProgramme.ts` - Initialization utility

---

**The Programme module is now fully functional and powered by Firestore!** 🎉
