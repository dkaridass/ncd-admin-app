# Programme Module Stabilization Summary

## Overview
The Programme module has been fully stabilized and restructured to use clean Firestore data models for both **Weekly Services** (Programme Hebdomadaire) and **Annual Programme 2026** (Programme Annuel 2026). All mock/hardcoded data has been removed, and the UI now displays real data from Firestore.

---

## What Was Changed

### 1. **Data Models** (`types.ts`)

**Added Types:**

- **`WeeklyService`**: Template for recurring weekly services
  - `dayOfWeek`: 'Dimanche' | 'Lundi' | ... | 'Samedi'
  - `serviceName`: e.g., "1er culte", "Culte"
  - `startTime`, `endTime`: Time strings (e.g., "07:20", "16:30")
  - `location`: Default location
  - `order`: For sorting multiple services on same day
  - `isActive`: Enable/disable without deleting

- **`AnnualEvent`**: Major annual events
  - `title`: Event name
  - `startDate`, `endDate`: ISO date strings
  - `location`: Event location
  - `category`: 'séminaire' | 'convention' | 'célébration' | etc.
  - `year`: e.g., 2026
  - `isActive`: Enable/disable

**Updated:**
- `Event` interface: Added optional `type` and `date` fields for backwards compatibility

---

### 2. **New Services**

#### `services/weeklyServicesService.ts`
- **CRUD operations** for weekly services
- **`initializeDefaults()`**: Creates 5 default NCD services:
  - Mercredi: Culte 16:30-18:30
  - Vendredi: Culte 16:30-18:30
  - Dimanche: 1er culte 07:20-09:20
  - Dimanche: 2ème culte 09:30-11:30
  - Dimanche: 3ème culte 16:00-18:00

#### `services/annualProgrammeService.ts`
- **CRUD operations** for annual events
- **`initialize2026()`**: Creates all 13 events from the 2026 poster:
  1. ÉCOLE DE LA COMMUNAUTÉ (Jan 4-9)
  2. 12 JOURS DE PRIÈRES (Jan 19-30)
  3. 28 MATINÉES DE GLOIRE (Feb 1-28)
  4. CONVENTION DES SŒURS (Mar 4-6)
  5. CÉLÉBRATION JVI (Mar 31 - Apr 3)
  6. CIEL OUVERT 50 JOURS (Apr 5 - May 24)
  7. SÉMINAIRE COUPLES & FAMILLES (Jun 21-27)
  8. MOIS ÉVANGÉLIQUE (Sep 1-30)
  9. CONEX 2026 (Oct 18-25)
  10. GALA D'HONNEUR (Oct 24 - Pullman Hotel)
  11. PRIÈRE DE FIN D'ANNÉE (Dec 4-24)
  12. CULTE DE NOËL (Dec 25)
  13. SPÉCIAL RÉVEILLON (Dec 31)

---

### 3. **DataContext Updates** (`context/DataContext.tsx`)

**Added:**
- `weeklyServices: WeeklyService[]` state
- `annualProgramme: AnnualEvent[]` state
- Real-time listeners for both collections
- Automatic sorting (weekly by day+order, annual by startDate)

**Listeners:**
- `weeklyServices`: Sorted by dayOfWeek and order
- `annualProgramme`: Sorted by startDate

---

### 4. **UI Updates**

#### `pages/EventsPage.tsx`
**Major Enhancements:**
- ✅ Added tabs: "Tous les Événements", "Programme Hebdomadaire", "Programme Annuel 2026", "Prochains", "Archives"
- ✅ **Programme Hebdomadaire Tab**:
  - Displays all weekly services grouped by day
  - Shows service name, time range, description
  - Empty state if no services initialized
- ✅ **Programme Annuel 2026 Tab**:
  - Displays all 13 events in chronological order
  - Shows event title, date range, location, category
  - Empty state if not initialized
- ✅ **"Prochain Culte" Widget**:
  - Now uses weekly services to calculate next service
  - Falls back to events if no weekly services available
  - Shows correct day, service name, and times

#### `components/ai/MorningPulseCard.tsx`
**Added:**
- ✅ "Prochain Événement Annuel" section
- ✅ Shows next upcoming 2026 event
- ✅ Clickable (navigates to annual programme tab)
- ✅ Only displays if there's an upcoming event

---

### 5. **Firestore Security Rules** (`firestore.rules`)

**Added Rules:**

```rules
// 14. Weekly Services
match /weeklyServices/{serviceId} {
  allow read: if isAuthenticated();
  allow write: if isSuperAdmin() || isPastor() || isStaffAdmin();
}

// 15. Annual Programme
match /annualProgramme/{eventId} {
  allow read: if isAuthenticated();
  allow write: if isSuperAdmin() || isPastor() || isStaffAdmin();
}
```

---

### 6. **Initialization Utility** (`utils/initializeProgramme.ts`)

**Function:**
- `initializeProgramme()`: One-time initialization of both collections
- Can be called from Settings page or browser console
- Idempotent (won't duplicate if already initialized)

---

### 7. **Mock Data Isolation**

**Updated:**
- `data/archive/mockData.ts`: Added deprecation comment
- Mock events marked as deprecated
- All UI now uses Firestore data exclusively

---

## Firestore Collections

### Collection: `weeklyServices`
**Structure:**
```typescript
{
  id: string;                    // Auto-generated
  dayOfWeek: string;             // "Dimanche", "Mercredi", "Vendredi"
  serviceName: string;            // "1er culte", "Culte"
  startTime: string;             // "07:20", "16:30"
  endTime: string;               // "09:20", "18:30"
  location: string;              // Default location
  description?: string;          // Optional description
  order: number;                 // For sorting (1, 2, 3 for Sunday)
  isActive: boolean;             // Enable/disable
}
```

**Default Services (5 total):**
- Mercredi: 1 service
- Vendredi: 1 service
- Dimanche: 3 services

---

### Collection: `annualProgramme`
**Structure:**
```typescript
{
  id: string;                    // Auto-generated
  title: string;                  // Event name
  description?: string;           // Optional description
  startDate: string;             // ISO date "2026-01-04"
  endDate: string;               // ISO date "2026-01-09"
  location?: string;             // Event location
  category?: string;             // "séminaire", "convention", etc.
  year: number;                  // 2026
  organizer?: string;             // Department/organizer
  isActive: boolean;             // Enable/disable
}
```

**2026 Events (13 total):**
- All events from the "FOCUS SUR JÉSUS" poster
- Chronologically ordered
- Gala d'Honneur has special location: "PULLMAN HOTEL GRAND KARAVIA"

---

## Data Flow

### Weekly Services:
1. **Initialization**: `weeklyServicesService.initializeDefaults()` → Creates 5 services
2. **Display**: `DataContext` listener → `EventsPage` → "Programme Hebdomadaire" tab
3. **Next Service**: `EventsPage` calculates next service from weekly schedule

### Annual Programme:
1. **Initialization**: `annualProgrammeService.initialize2026()` → Creates 13 events
2. **Display**: `DataContext` listener → `EventsPage` → "Programme Annuel 2026" tab
3. **Dashboard**: `MorningPulseCard` shows next upcoming event

---

## Files Changed

### Created:
1. `services/weeklyServicesService.ts` - Weekly services CRUD
2. `services/annualProgrammeService.ts` - Annual programme CRUD
3. `utils/initializeProgramme.ts` - Initialization utility
4. `docs/PROGRAMME_TESTING_GUIDE.md` - Comprehensive testing guide
5. `docs/PROGRAMME_STABILIZATION_SUMMARY.md` - This document

### Modified:
1. `types.ts` - Added `WeeklyService` and `AnnualEvent` interfaces
2. `context/DataContext.tsx` - Added listeners and state
3. `pages/EventsPage.tsx` - Added tabs and display logic
4. `components/ai/MorningPulseCard.tsx` - Added next annual event widget
5. `firestore.rules` - Added security rules
6. `data/archive/mockData.ts` - Added deprecation comment

---

## Migration Notes

### From Old System:
- **Old**: `updateProgramme.ts` generated individual event documents for next 6 months
- **New**: `weeklyServices` collection stores templates, UI calculates next service dynamically
- **Benefit**: No need to regenerate events, cleaner data model, easier to update schedule

### Backwards Compatibility:
- `events` collection still exists and works
- Old event documents are not deleted
- New system works alongside old system
- Can gradually migrate to new system

---

## Testing

See `docs/PROGRAMME_TESTING_GUIDE.md` for complete testing instructions.

**Quick Test:**
1. Initialize programme data (via Settings or console)
2. Navigate to `/events`
3. Click "Programme Hebdomadaire" tab → Verify 5 services
4. Click "Programme Annuel 2026" tab → Verify 13 events
5. Check "Prochain Culte" widget → Should show next service
6. Check Dashboard → Should show next annual event

---

## Next Steps (Future Enhancements)

1. **Admin UI**: Add forms to edit weekly services and annual events
2. **Multi-Year Support**: Extend to support 2027, 2028, etc.
3. **Service Templates**: Allow custom service types
4. **Notifications**: Alert users about upcoming events
5. **Export**: Export to PDF/Calendar format
6. **RSVP Integration**: Link annual events to RSVP system
7. **Department Linking**: Associate events with departments

---

## Summary

The Programme module is now fully functional, clean, and powered by Firestore:

✅ **Weekly Services**: Clean template-based system, no more generating individual events  
✅ **Annual Programme 2026**: All 13 events from poster, properly structured  
✅ **Real-time Updates**: All data syncs automatically via Firestore listeners  
✅ **No Mock Data**: Everything comes from Firestore  
✅ **User-Friendly UI**: Clear tabs, empty states, helpful messages  
✅ **Dashboard Integration**: Next service and next annual event widgets  
✅ **Security**: Proper Firestore rules for read/write access  

**The Programme module is production-ready!** 🎉
