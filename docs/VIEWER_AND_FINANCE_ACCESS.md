# VIEWER Role & Finance Access Policy

This document summarizes what users with the **VIEWER** role can see and which roles can access financial information (pages, dashboard widgets, and AI answers).

## Intended rule

- **VIEWER** = non-sensitive content only (announcements, events, limited members list, etc.).
- **VIEWER must not**: open finances pages, see money amounts anywhere, or get financial answers from the AI assistant.

---

## What a VIEWER can see

| Area | Access |
|------|--------|
| **Dashboard** | Yes, but **without** any finance KPIs (Recettes USD/CDF) and **without** “Soldes des Comptes” or “Alerte Finance” in MorningPulseCard. |
| **Events** | Yes. |
| **Communications** | Yes. |
| **Resources** | Yes. |
| **Volunteers** | Yes. |
| **Prayer requests** | Yes. |
| **AI Assistant** | Yes, for **non-financial** questions only. |
| **Members** | No (requires `VIEW_MEMBERS`). |
| **Departments** | No (requires `MANAGE_DEPARTMENTS`). |
| **Finances** | No (route and nav hidden; requires `VIEW_FINANCES`). |
| **Settings / Users** | No (require `MANAGE_SETTINGS` / `MANAGE_ROLES`). |

---

## Who can see money and use AI for financial questions

Only roles that have the **VIEW_FINANCES** permission:

| Role | VIEW_FINANCES | Can see finances page, dashboard money, AI financial answers |
|------|----------------|--------------------------------------------------------------|
| **SUPER_ADMIN** | ✅ | Yes |
| **FINANCE_ADMIN** | ✅ | Yes |
| **PASTOR** | ✅ | Yes |
| **STAFF_ADMIN** | ✅ | Yes |
| **DEPT_LEADER** | ❌ | No |
| **VOLUNTEER** | ❌ | No |
| **MEMBER** | ❌ | No |
| **VIEWER** | ❌ | No |

---

## Implementation summary

1. **ROLE_PERMISSIONS** (`context/DataContext.tsx`)  
   - `VIEWER: []` — no permissions.  
   - `VIEW_FINANCES` is given to: `SUPER_ADMIN`, `FINANCE_ADMIN`, `PASTOR`, `STAFF_ADMIN`.

2. **Route protection** (`App.tsx` + `ProtectedRoute`)  
   - `/finances` is wrapped in `<ProtectedRoute requiredPermission="VIEW_FINANCES">` → VIEWER is redirected to dashboard.

3. **Dashboard money**  
   - Top KPI row: “Recettes (USD)” and “Recettes (CDF)” are shown only when `hasPermission('VIEW_FINANCES')`.  
   - “Soldes des Comptes” (AccountBalancesStrip) is already gated by `VIEW_FINANCES`.  
   - MorningPulseCard “Alerte Finance” block is shown only when `hasPermission('VIEW_FINANCES')`.

4. **AI assistant** (`pages/AiAssistantPage.tsx`)  
   - Before calling the Groq API, the user message is checked with `isFinancialQuestion()`.  
   - If it is financial and the user does **not** have `VIEW_FINANCES`, the assistant replies with:  
     *“Vous n'avez pas les autorisations nécessaires pour consulter les informations financières. Veuillez contacter un responsable.”*  
     and the API is not called.

5. **Nav**  
   - Sidebar and bottom nav show the Finances link only when `hasPermission('VIEW_FINANCES')`.

---

## AI financial-question detection

The helper `isFinancialQuestion(text)` in `AiAssistantPage.tsx` treats a message as financial if it matches patterns such as:

- Words: argent, soldes, recettes, dépenses, budget, finances, comptes, totaux, montant, rawbank, USD, CDF, etc.
- Phrases like “combien d’argent”, “combien avons-nous”, “combien sur …”, “rapport financier”, “bilan des comptes”.

For any such question, users without `VIEW_FINANCES` receive only the refusal message above.
