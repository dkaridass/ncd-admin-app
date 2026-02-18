# 🧪 Dashboard Testing Guide

**Date:** 2026-01-24  
**Purpose:** Complete testing guide for the world-class Dashboard

---

## Prerequisites

1. **App Running:** `npm run dev` (should be on http://localhost:3000)
2. **Login:** Use `admin@ncd.com` credentials
3. **Firestore:** Ensure collections have some data for testing

---

## Test 1: Dashboard Loads & Shows Real Data

### Steps:
1. Navigate to Dashboard (`/dashboard`)
2. Wait for page to load (check for loading states)

### Expected Results:
- ✅ MorningPulseCard (Pouls du Ministère) displays at top
- ✅ All 4 KPI cards show real values (not "..." or "-")
- ✅ Attendance chart displays (or shows empty state if no data)
- ✅ Agenda du Jour shows today's departments (or empty state)
- ✅ Tasks section shows pending tasks (or empty state)

### Verify Real Data:
- **Total Membres:** Should match count in Firestore `/members`
- **Dernier Culte:** Should show latest attendance record
- **Recettes USD/CDF:** Should match sum of income records (excluding expenses)
- **Trends:** Should show calculated percentages (not hardcoded)

---

## Test 2: KPI Cards Navigation

### Steps:
1. Click on **"Total Membres"** card
2. Click on **"Dernier Culte"** card
3. Click on **"Recettes (USD)"** card
4. Click on **"Recettes (CDF)"** card

### Expected Results:
- ✅ "Total Membres" → Navigates to `/members`
- ✅ "Dernier Culte" → Navigates to `/events`
- ✅ "Recettes (USD)" → Navigates to `/finances`
- ✅ "Recettes (CDF)" → Navigates to `/finances`
- ✅ Cards have hover effect (border color change)

---

## Test 3: Finance Quick Entry

### Steps:
1. Click **"Offrande"** button in Quick Actions
2. Fill in form:
   - Amount: `5000`
   - Currency: `CDF`
   - Type: `Offrande`
   - Account: `Cash`
   - Notes: `Test dashboard entry`
3. Click **"Valider l'Offrande"**

### Expected Results:
- ✅ Modal closes
- ✅ Finance record appears in Firestore `/finances` collection
- ✅ **Recettes (CDF)** KPI card updates immediately (real-time)
- ✅ Value increases by 5000 CDF

### Verify in Firestore:
- Open Firestore Console
- Check `/finances` collection
- Find document with `amount: 5000`, `account: "Cash"`
- Verify `recordedBy` shows your name

---

## Test 4: Member Quick Entry

### Steps:
1. Click **"Fidèle"** button in Quick Actions
2. Fill in form:
   - Nom Complet: `Test Dashboard Member`
   - Genre: `Homme`
   - Statut: `Fidèle`
   - Téléphone: `+243900000001`
3. Click **"Enregistrer"**

### Expected Results:
- ✅ Modal closes
- ✅ Member appears in Firestore `/members` collection
- ✅ **Total Membres** KPI card updates immediately (real-time)
- ✅ Count increases by 1

### Verify in Firestore:
- Check `/members` collection
- Find document with `name: "Test Dashboard Member"`
- Verify all fields saved correctly

---

## Test 5: Attendance Quick Entry

### Steps:
1. Click **"Culte"** button in Quick Actions
2. Fill in form:
   - Date: Today's date
   - Hommes: `50`
   - Femmes: `60`
   - Enfants: `20`
3. Click **"Enregistrer"**

### Expected Results:
- ✅ Modal closes
- ✅ Attendance record appears in Firestore `/attendance` collection
- ✅ **Dernier Culte** KPI card updates immediately
- ✅ Shows `130` (total count)
- ✅ Attendance chart updates (new data point)

### Verify in Firestore:
- Check `/attendance` collection
- Find document with today's date
- Verify `totalCount: 130`

---

## Test 6: Real-Time Updates

### Steps:
1. Open Dashboard in **two browser windows** (or incognito + normal)
2. Login as `admin@ncd.com` in both
3. In Window 1: Add a finance record (Test 3)
4. In Window 2: **Watch KPI cards update automatically**

### Expected Results:
- ✅ Finance KPI updates in Window 2 without refresh
- ✅ No manual refresh needed
- ✅ Console shows: `✅ Finance records updated: X records`

---

## Test 7: MorningPulseCard Interactions

### Steps:
1. Check **"Priorité du Jour"** section
2. Check **"Alerte Finance"** section
3. Check **"Rhéma du Jour"** section
4. Click **"Voir le dashboard"** button

### Expected Results:
- ✅ Priorité du Jour shows today's event or department meeting
- ✅ Alerte Finance shows weekly total and trend
- ✅ Rhéma du Jour shows today's Bible verse
- ✅ "Voir le dashboard" button navigates to `/dashboard` (scrolls to top)

### Click Tests:
- Click on **"Priorité du Jour"** card → Navigates to `/events`
- Click on **"Alerte Finance"** card → Navigates to `/finances`

---

## Test 8: Agenda du Jour Interactions

### Steps:
1. Check **"Agenda du Jour"** section
2. If departments are listed, click on one
3. If empty, check empty state message

### Expected Results:
- ✅ Shows departments meeting today
- ✅ Clicking a department navigates to `/departments`
- ✅ Empty state shows message + link to departments
- ✅ Loading state shows skeleton if data is loading

---

## Test 9: Tasks Section

### Steps:
1. Check **"À Faire"** section
2. If tasks exist, click on one to mark complete
3. If empty, check empty state

### Expected Results:
- ✅ Shows pending tasks (if any)
- ✅ Clicking task marks it complete
- ✅ Empty state shows friendly message
- ✅ Card is clickable → Navigates to `/assistant`

---

## Test 10: Calculated Trends

### Steps:
1. Check **"Total Membres"** trend percentage
2. Check **"Recettes (USD)"** trend percentage
3. Check **"Recettes (CDF)"** trend percentage

### Expected Results:
- ✅ **Total Membres:** Shows growth % (last 30 days vs previous 30 days)
- ✅ **Recettes USD:** Shows month-over-month % change
- ✅ **Recettes CDF:** Shows month-over-month % change
- ✅ Trends show "+" for positive, "-" for negative
- ✅ Colors: Green for positive, Red for negative

### Manual Verification:
- Calculate trends manually from Firestore data
- Compare with dashboard values
- Should match within rounding

---

## Test 11: Loading States

### Steps:
1. Hard refresh page (Cmd+Shift+R)
2. Watch dashboard load

### Expected Results:
- ✅ KPI cards show "..." while loading
- ✅ Chart shows loading skeleton
- ✅ Agenda shows loading skeleton
- ✅ Tasks show loading skeleton
- ✅ No blank/flashing content

---

## Test 12: Empty States

### Steps:
1. If no attendance data, check chart empty state
2. If no departments today, check agenda empty state
3. If no tasks, check tasks empty state

### Expected Results:
- ✅ Chart shows message + "Ajouter une session" button
- ✅ Agenda shows message + link to departments
- ✅ Tasks shows friendly empty message
- ✅ All empty states are visually clear and helpful

---

## Test 13: Error Handling

### Steps:
1. Disconnect internet
2. Try to add finance record
3. Check error message

### Expected Results:
- ✅ Error message displayed
- ✅ Modal doesn't close on error
- ✅ User can retry or cancel

---

## Test 14: Finance Form Account Field

### Steps:
1. Open finance quick entry modal
2. Check account dropdown

### Expected Results:
- ✅ Account dropdown present
- ✅ Options: Cash, Rawbank, Equity, Mpesa, OrangeMoney, PayPal
- ✅ Default: Cash
- ✅ Selected account saved in Firestore

---

## Test 15: Member Form Fields

### Steps:
1. Open member quick entry modal
2. Check form fields

### Expected Results:
- ✅ Single "Nom Complet" field (not firstName/lastName)
- ✅ Genre dropdown (Homme/Femme)
- ✅ Statut dropdown (Fidèle/Visiteur/Archivé)
- ✅ Téléphone field
- ✅ All fields match Member type definition

---

## Firestore Verification Checklist

After testing, verify in Firestore Console:

### **`/finances` Collection:**
- [ ] Dashboard entries have `account` field
- [ ] `recordedBy` shows current user name
- [ ] Records appear immediately after creation

### **`/members` Collection:**
- [ ] Dashboard entries use `name` field (not firstName/lastName)
- [ ] All required fields populated
- [ ] `avatarUrl` auto-generated

### **`/attendance` Collection:**
- [ ] Dashboard entries have correct date
- [ ] `totalCount` calculated correctly
- [ ] Records appear immediately

---

## Performance Testing

### **Large Dataset:**
1. Create 100+ finance records
2. Create 500+ members
3. Check dashboard load time

### Expected:
- ✅ Dashboard loads in < 3 seconds
- ✅ Real-time updates still work
- ✅ No performance degradation

---

## Common Issues & Solutions

### **Issue: KPIs show "..." forever**
- **Cause:** Data not loading
- **Solution:** Check Firestore rules, verify collections exist

### **Issue: Trends show 0%**
- **Cause:** No historical data
- **Solution:** Normal if no previous period data exists

### **Issue: Click handlers don't work**
- **Cause:** Navigation not imported
- **Solution:** Verify `useNavigate` hook is used

### **Issue: Real-time updates not working**
- **Cause:** Listeners not set up
- **Solution:** Check browser console for listener errors

---

## Success Criteria

✅ **All tests pass**
✅ **No mock/hardcoded data**
✅ **All interactions work**
✅ **Real-time sync works**
✅ **Loading/empty states handled**
✅ **Navigation works correctly**

---

**End of Dashboard Testing Guide**
