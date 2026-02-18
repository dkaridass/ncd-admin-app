# 💳 Account Balances Strip

**Date:** 2026-01-24  
**Purpose:** Account balance cards (Soldes par Compte) — **100% backend-driven**, no mock data.

---

## 🧩 Components & Data Flow

| Component | Path | Role |
|-----------|------|------|
| **BalanceCard** | `components/finance/BalanceCard.tsx` | Single account card: logo, name, formatted balance, currency |
| **BalanceCardSkeleton** | `components/finance/BalanceCardSkeleton.tsx` | Loading placeholder (same dimensions as card) |
| **AccountsGrid** | `components/finance/AccountsGrid.tsx` | Horizontal carousel of BalanceCards; shows skeletons when loading |
| **AccountBalancesStrip** | `components/finance/AccountBalancesStrip.tsx` | Uses `useAccountBalances`, renders grid + error banner |

### Where the cards get their data

**Data source:** Firestore `finances` collection → **DataContext** (`financeRecords`) → **`useAccountBalances`** hook.

1. **DataContext** subscribes to `finances` via `onSnapshot`. It exposes `financeRecords`, `financeError`, `financeSnapshotReceived`.
2. **`useAccountBalances`** (`hooks/useAccountBalances.ts`) computes per-account balances from `financeRecords` (inflows add, Dépense subtracts, by account and currency). It returns `{ items, isLoading, error }`.
3. **AccountBalancesStrip** calls `useAccountBalances()`, passes `items` and `isLoading` to **AccountsGrid**, and shows an error banner if `error` is set.
4. **BalanceCard** receives `BalanceCardItem` (`account`, `balance`, `currency`) — no hardcoded numbers.

**No mock data.** Balances are derived only from Firestore `finances` documents. Loading → skeletons; error → "Erreur de chargement" banner.

### Logo mapping (real assets)

| Account | Logo path |
|---------|-----------|
| Rawbank | `/logos/rawbank.png` |
| Orange Money | `/logos/orange.png` |
| PayPal | `/logos/paypal.png` |
| MoneyGram | `/logos/moneygram.png` |
| M-Pesa | `/logos/mpesa.png` |
| Equity | `/logos/equity.png` |
| Cash | No logo (text badge) |

---

## 🎨 Where the Component Appears

`AccountBalancesStrip` (which uses **AccountsGrid** → **BalanceCard** internally) is imported and used in:

1. **Dashboard** (`/`) — `pages/DashboardPage.tsx`
   - Import: `import AccountBalancesStrip from '../components/finance/AccountBalancesStrip';`
   - Section: "Soldes des Comptes"
   - Location: After the KPI cards (only visible if user has `VIEW_FINANCES` permission)

2. **Finance Page** (`/finances`) — `pages/FinancesPage.tsx`
   - Import: `import AccountBalancesStrip from '../components/finance/AccountBalancesStrip';`
   - Section: "Soldes par Compte"
   - Location: After the Exchange Rate & Finance Summary cards

`BalanceCard` and `AccountsGrid` are not imported directly by pages; they are used only inside `AccountBalancesStrip`.

---

## 🎯 Component Features

- **Layout:** Horizontal carousel (Apple Wallet style), `snap-x` / `snap-center`, hidden scrollbar.
- **Loading:** Skeletons instead of 0s while Firestore snapshot is pending.
- **Error:** Red banner "Erreur de chargement des soldes" when the finances listener errors.
- **Account-specific styling:** Official brand colors; logo-based cards; rounded-3xl.
- **Currency:** USD `$1,234.56`; CDF `FC 1,234,567`.

---

## ✅ Testing (E2E)

1. **Non-zero balances:** Add `finances` docs (Offrande/Dépense, various `account`/`currency`). Each card shows the correct computed balance and currency.
2. **Refresh:** Reload the app; balances stay correct (no fallback to mock).
3. **Console:** No errors from `undefined` balance fields.
4. **Loading:** Before first snapshot, skeletons appear (no 0s).
5. **Error:** Simulate listener failure (e.g. rules deny read); error banner appears.

---

**End of Guide**
