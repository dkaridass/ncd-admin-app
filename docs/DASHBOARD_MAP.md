# 📊 Dashboard Data Source Map

**Date:** 2026-01-24  
**Purpose:** Complete mapping of all dashboard sections and their data sources

---

## Dashboard Structure Overview

### **1. MorningPulseCard (Pouls du Ministère)**
**Location:** `components/ai/MorningPulseCard.tsx`

#### Sections:
- **Agenda Priority** (Priorité du Jour)
  - **Data Source:** `/events` collection (real-time listener)
  - **Fallback:** `/departments` collection (meetingDay filter)
  - **Status:** ✅ Real data
  
- **Finance Pulse** (Alerte Finance)
  - **Data Source:** `/finances` collection (real-time listener)
  - **Calculation:** This week vs last week offerings (USD equivalent)
  - **Status:** ✅ Real data
  
- **Rhéma du Jour**
  - **Data Source:** `/rhema` collection (real-time listener)
  - **Status:** ✅ Real data (French Bible verses)
  
- **Pending Tasks**
  - **Data Source:** `tasks` array from context
  - **Status:** ⚠️ Empty array (no service layer implemented)

**Issues:**
- "Voir le dashboard" button doesn't navigate
- Tasks count shows 0 (no tasks service)

---

### **2. Top KPI Row**
**Location:** `pages/DashboardPage.tsx` (lines 282-305)

#### Cards:
- **Total Membres**
  - **Data Source:** `/members` collection (real-time listener)
  - **Value:** `members.length`
  - **Trend:** ⚠️ Hardcoded "+4%"
  - **Status:** ✅ Real count, ❌ Mock trend
  
- **Dernier Culte**
  - **Data Source:** `/attendance` collection (real-time listener)
  - **Value:** `attendance[0]?.totalCount`
  - **Trend:** Calculated from last 2 sessions
  - **Status:** ✅ Real data
  
- **Recettes (USD)**
  - **Data Source:** `/finances` collection (real-time listener)
  - **Value:** Sum of USD income (excluding expenses)
  - **Trend:** ⚠️ Hardcoded "Global"
  - **Status:** ✅ Real data, ❌ Mock trend
  
- **Recettes (CDF)**
  - **Data Source:** `/finances` collection (real-time listener)
  - **Value:** Sum of CDF income (excluding expenses)
  - **Trend:** ⚠️ Hardcoded "Global"
  - **Status:** ✅ Real data, ❌ Mock trend

**Issues:**
- No click handlers to navigate to modules
- Hardcoded trends instead of calculated

---

### **3. Attendance Chart**
**Location:** `pages/DashboardPage.tsx` (lines 312-333)

- **Data Source:** `/attendance` collection (real-time listener)
- **Value:** Last 6 sessions, reversed
- **Status:** ✅ Real data

**Issues:**
- None (working correctly)

---

### **4. Agenda du Jour**
**Location:** `pages/DashboardPage.tsx` (lines 339-378)

- **Data Source:** `/departments` collection (real-time listener)
- **Filter:** Departments meeting today (by day name)
- **Status:** ✅ Real data

**Issues:**
- No click handler to navigate to department detail

---

### **5. Tasks Section (À Faire)**
**Location:** `pages/DashboardPage.tsx` (lines 381-398)

- **Data Source:** `tasks` array from context
- **Filter:** `tasks.filter(t => t.status !== 'DONE')`
- **Status:** ⚠️ Empty array (no service layer)

**Issues:**
- Tasks array is always empty
- No service layer to fetch/create tasks
- No empty state message

---

### **6. Quick Actions**
**Location:** `pages/DashboardPage.tsx` (lines 266-279)

- **Culte:** Opens attendance modal ✅
- **Fidèle:** Opens member modal ⚠️ (wrong form fields)
- **Offrande:** Opens finance modal ⚠️ (missing account field)

**Issues:**
- Member form uses `firstName`/`lastName` instead of `name`
- Finance form missing `account` field

---

## Data Flow Summary

### **Real-Time Listeners (✅ Working):**
- `/members` → `members` state
- `/departments` → `departments` state
- `/finances` → `financeRecords` state
- `/attendance` → `attendance` state
- `/events` → `events` state
- `/rhema` → `dailyRhema` state

### **Missing/Empty:**
- `tasks` → Empty array (no service layer)
- No listener for `/tasks` collection

---

## Firestore Collections Used

1. **`/members`** - Member count, member data
2. **`/departments`** - Department list, meeting schedules
3. **`/finances`** - Financial records, totals, trends
4. **`/attendance`** - Service attendance, trends
5. **`/events`** - Calendar events, today's agenda
6. **`/rhema`** - Daily Bible verse
7. **`/tasks`** - ⚠️ Not implemented (collection may not exist)

---

## Issues Summary

### **Critical:**
1. ❌ Tasks service layer missing
2. ❌ Member form wrong fields
3. ❌ Finance form missing account

### **Medium:**
4. ⚠️ Hardcoded trends in KPIs
5. ⚠️ No click handlers on cards
6. ⚠️ No navigation from buttons

### **Low:**
7. ⚠️ No loading skeletons
8. ⚠️ No empty state messages
9. ⚠️ No error handling UI

---

**End of Dashboard Map**
