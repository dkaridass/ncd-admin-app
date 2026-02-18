# 🔍 Comprehensive Code Audit - Potential Issues Found

## ⚠️ **ISSUES FOUND**

### 1. **Firestore `undefined` Value Issues** (Similar to member update bug)

**Risk:** Other services may have the same `undefined` value problem when updating Firestore documents.

**Affected Services:**
- ❌ `announcementsService.ts` - No undefined sanitization
- ❌ `resourcesService.ts` - No undefined sanitization  
- ❌ `prayerRequestsService.ts` - No undefined sanitization (spreads updates)
- ❌ `appSettingsService.ts` - No undefined sanitization
- ❌ `eventsService.ts` - Need to verify
- ❌ `annualProgrammeService.ts` - Need to verify
- ❌ `weeklyServicesService.ts` - Need to verify
- ❌ `attendanceService.ts` - Need to verify

**Already Fixed:**
- ✅ `membersService.ts` - Has sanitization
- ✅ `financeService.ts` - Has sanitization

---

### 2. **Leftover Gemini References** (Non-functional but confusing)

**Found:**
- ❌ `package.json` - Still has `@google/genai` dependency (unused)
- ❌ `vite.config.ts` - Still references `GEMINI_API_KEY` (unused)
- ❌ `pages/SettingsPage.tsx` - UI text says "Google Gemini" and "Gemini 3 Pro" (should say "Groq")
- ❌ `pages/LoginPage.tsx` - Mentions "Google AI Studio" (outdated)

**Impact:** Low - Doesn't break functionality but is confusing for users

---

### 3. **Potential Type Safety Issues**

**Risk:** Optional fields in TypeScript interfaces might be `undefined` when passed to Firestore.

**Recommendation:** Add sanitization helper function to prevent future issues.

---

## 🎯 **RECOMMENDED FIXES**

### Priority 1: Fix Firestore Update Services (Prevent Future Bugs)
Add undefined sanitization to all update methods.

### Priority 2: Clean Up Gemini References (Code Cleanliness)
Remove unused dependencies and update UI text.

### Priority 3: Create Reusable Helper (Best Practice)
Create a `sanitizeFirestoreUpdates()` helper function.

---

## ✅ **ACTION ITEMS**

1. Add undefined sanitization to all service update methods
2. Remove `@google/genai` from package.json
3. Remove GEMINI_API_KEY from vite.config.ts
4. Update SettingsPage.tsx text to say "Groq" instead of "Gemini"
5. Create reusable sanitization helper function
