# ⚙️ Settings Module - Current State Audit

**Date:** 2024-01-XX  
**Purpose:** Audit of current configuration and hardcoded values

---

## 1. Current Settings Locations

### **Church Information**

**Location:** `pages/SettingsPage.tsx` (lines 55-61)
**Status:** ❌ Hardcoded in component state
**Values:**
```typescript
{
  name: 'NCD La Pentecôte',
  city: 'Lubumbashi',
  pastor: 'Dr Jean-Clément Diambilay',
  email: 'contact@ncd.cd',
  serviceTimes: 'Dimanche 8h00, 10h30 | Mercredi 17h00'
}
```

**Used In:**
- SettingsPage (display only, not saved)
- Dashboard (logo reference: `/logo.png`)
- Various pages (hardcoded "NCD La Pentecôte" in titles)

---

### **Finance Accounts**

**Location:** `types.ts` (line 141)
**Status:** ❌ Hardcoded as TypeScript type
**Values:**
```typescript
export type FinanceAccount = 'Rawbank' | 'Equity' | 'PayPal' | 'Mpesa' | 'OrangeMoney' | 'Cash';
```

**Used In:**
- `pages/FinancesPage.tsx` - Account dropdown options (hardcoded)
- `pages/DashboardPage.tsx` - Account dropdown options (hardcoded)
- `data/manualAccountBalances.ts` - Account list (hardcoded)
- `components/finance/AccountBalancesStrip.tsx` - Account colors/icons (hardcoded)
- `services/financeService.ts` - Account balances calculation (hardcoded)

**Issues:**
- Cannot add/remove accounts without code changes
- Account display names hardcoded in multiple places
- Account colors/icons hardcoded

---

### **Currencies**

**Location:** `types.ts`
**Status:** ✅ Type definition (probably fine to keep)
**Values:**
```typescript
export type Currency = 'CDF' | 'USD';
```

**Used In:**
- Finance forms
- Account balances

**Note:** Probably fine to keep as type since currencies are unlikely to change

---

### **Church Roles (ChurchRole)**

**Location:** `types.ts` (line 5)
**Status:** ❌ Hardcoded as TypeScript type
**Values:**
```typescript
export type ChurchRole = 'Pasteur' | 'Pasteure' | 'Berger' | 'Bergère' | 'Frère' | 'Sœur' | 'Vice-président' | 'Admin' | 'Admin adjoint' | 'Secrétaire' | 'Serviteur' | 'Fidèle';
```

**Used In:**
- `components/members/MemberDrawer.tsx` - Role dropdown (hardcoded)
- Member forms

**Issues:**
- Cannot add/remove roles without code changes
- Roles are church-specific and should be configurable

---

### **Church Functions (ChurchFunction)**

**Location:** `types.ts` (lines 7-19)
**Status:** ❌ Hardcoded as TypeScript type
**Values:**
```typescript
export type ChurchFunction =
  | 'Pasteur principal'
  | 'Pasteur résident'
  | 'Pasteur résident adjoint'
  | 'Pasteur'
  | 'Berger'
  | 'Administrateur principal'
  | 'Administrateur adjoint'
  | 'Administrateur'
  | 'Président de département'
  | 'Vice président de département'
  | 'Serviteur'
  | 'Aucune';
```

**Used In:**
- `components/members/MemberDrawer.tsx` - Function dropdown (hardcoded)
- Member forms

**Issues:**
- Cannot add/remove functions without code changes
- Functions are church-specific and should be configurable

---

### **App Roles (AppRole)**

**Location:** `types.ts` (line 21)
**Status:** ⚠️ Hardcoded but probably fine to keep
**Values:**
```typescript
export type AppRole = 'SUPER_ADMIN' | 'PASTOR' | 'STAFF_ADMIN' | 'FINANCE_ADMIN' | 'DEPT_LEADER' | 'VOLUNTEER' | 'MEMBER' | 'VIEWER';
```

**Note:** These are system-level roles tied to RBAC. Probably fine to keep as type, but display labels could be configurable.

---

### **Programme Defaults**

**Location:** `services/weeklyServicesService.ts` - `initializeDefaults()`
**Status:** ❌ Hardcoded in service
**Values:**
- 5 default weekly services (Mercredi, Vendredi, 3x Dimanche)
- Times, locations hardcoded

**Used In:**
- Programme initialization
- Weekly services display

**Issues:**
- Cannot change default times/locations without code changes

---

### **Manual Account Balances**

**Location:** `data/manualAccountBalances.ts`
**Status:** ❌ Hardcoded array
**Values:**
```typescript
export const manualAccountBalances: ManualAccountBalance[] = [
  { account: "Rawbank", balance: 0, currency: "USD" },
  { account: "Equity", balance: 0, currency: "USD" },
  // ...
];
```

**Used In:**
- `components/finance/AccountBalancesStrip.tsx`

**Note:** This is manual balances, not settings. But account list should come from settings.

---

### **AI Configuration**

**Location:** `pages/SettingsPage.tsx` (lines 64-68)
**Status:** ❌ Hardcoded in component state (not saved)
**Values:**
```typescript
{
  tone: 'Pastoral',
  formality: 'Soutenu',
  systemPrompt: 'Tu es un assistant administratif chrétien expert...'
}
```

**Issues:**
- Not saved to Firestore
- Changes are lost on page refresh

---

## 2. Summary: What Needs to Move to Settings

### **High Priority (User-Visible Config):**
1. ✅ Church name, logo, address, contact info
2. ✅ Finance accounts list (add/remove accounts)
3. ✅ Church roles (ChurchRole) - configurable list
4. ✅ Church functions (ChurchFunction) - configurable list
5. ✅ Programme defaults (weekly service times/locations)

### **Medium Priority:**
6. ✅ AI configuration (tone, formality, system prompt)
7. ✅ Default currency
8. ✅ Account display names and colors

### **Low Priority (Keep as Constants):**
- App roles (AppRole) - System-level, tied to RBAC
- Currencies (CDF/USD) - Unlikely to change
- Permission types - System-level

---

## 3. Current SettingsPage Implementation

**File:** `pages/SettingsPage.tsx`

**Current Tabs:**
1. **Identité Église** - Church info (hardcoded, not saved)
2. **Sécurité & Rôles** - RBAC matrix (read-only, from DataContext)
3. **Système & IA** - AI config (hardcoded, not saved) + Maintenance tools

**Issues:**
- Church info form exists but doesn't save to Firestore
- AI config form exists but doesn't save to Firestore
- No section for Finance accounts
- No section for Programme defaults
- No section for Roles/Functions configuration

---

## 4. Firestore Collections Check

**Current Collections:**
- `/users` - User profiles
- `/members` - Members
- `/departments` - Departments
- `/finances` - Finance records
- `/announcements` - Announcements
- `/resources` - Resources
- `/weeklyServices` - Weekly programme
- `/annualProgramme` - Annual programme
- `/prayer_requests` - Prayer requests

**Missing:**
- ❌ `/appSettings` - Global app configuration

---

## 5. Recommendations

### **Create `/appSettings` Collection:**

**Document Structure:**
```typescript
// Document: /appSettings/general
{
  churchName: string;
  slogan?: string;
  address?: string;
  city: string;
  country?: string;
  phone?: string;
  email: string;
  logoUrl?: string; // Firebase Storage path
  pastorName?: string;
  serviceTimes?: string; // Free text
}

// Document: /appSettings/finance
{
  accounts: Array<{
    id: string;
    name: string;
    displayName: string;
    currency: 'USD' | 'CDF';
    isActive: boolean;
    color?: string; // For UI
    icon?: string; // Emoji or icon name
  }>;
  defaultCurrency: 'USD' | 'CDF';
  defaultAccount: string; // Account ID
}

// Document: /appSettings/rolesAndFunctions
{
  churchRoles: Array<{
    id: string;
    label: string;
    isActive: boolean;
  }>;
  churchFunctions: Array<{
    id: string;
    label: string;
    isActive: boolean;
  }>;
}

// Document: /appSettings/programme
{
  defaultWeeklyServices: Array<{
    dayOfWeek: string;
    serviceName: string;
    startTime: string;
    endTime: string;
    location: string;
    description?: string;
    order: number;
  }>;
  defaultLocation: string;
}

// Document: /appSettings/ai
{
  tone: 'Pastoral' | 'Formel' | 'Analytique';
  formality: 'Soutenu' | 'Courant' | 'Simple';
  systemPrompt: string;
  apiKey?: string; // Encrypted or stored securely
}
```

---

**Last Updated:** 2024-01-XX  
**Status:** Audit Complete - Ready for Implementation
