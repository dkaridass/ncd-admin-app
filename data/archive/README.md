# Mock Data Archive

This directory contains **deprecated mock data files** that were used during the prototype phase of the NCD Admin App.

## ⚠️ IMPORTANT

**These files are NO LONGER USED by the application.**

The app now uses **Firebase Firestore** as the single source of truth for all data:
- Members → `/members` collection
- Departments → `/departments` collection
- Finance → `/finances` collection
- Events → `/events` collection
- etc.

## Files Archived

- `members.json` - Old mock member data
- `departments.json` - Old mock department data
- `mockData.ts` - Old mock data generator

## Why These Were Archived

1. **Prevent Confusion** - Developers should not accidentally reference these files
2. **Single Source of Truth** - All data comes from Firestore
3. **Historical Reference** - Kept for reference if needed during migration verification

## If You Need Mock Data

For testing purposes, use the Firebase Emulator with seed data instead of these JSON files.

---

**Last Updated:** 2026-01-24  
**Archived By:** Stabilization Phase 4
