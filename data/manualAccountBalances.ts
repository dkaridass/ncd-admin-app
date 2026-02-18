/**
 * Manual Account Balances
 * 
 * This is the source of truth for account balances until we implement
 * Firestore-computed balances or real bank API integration.
 * 
 * To update balances, simply modify the values below.
 */

import { FinanceAccount, Currency } from '../types';

export interface ManualAccountBalance {
  account: FinanceAccount;
  balance: number;
  currency: Currency;
}

/**
 * Manual Account Balances Configuration
 * 
 * Edit the balance values below to update account balances.
 * The component will automatically display these values.
 */
export const manualAccountBalances: ManualAccountBalance[] = [
  { account: "Rawbank", balance: 15420.50, currency: "USD" },
  { account: "OrangeMoney", balance: 850000, currency: "CDF" },
  { account: "PayPal", balance: 320.00, currency: "USD" },
  { account: "MoneyGram", balance: 0, currency: "USD" },
  { account: "Mpesa", balance: 1250000, currency: "CDF" },
  { account: "Equity", balance: 500.00, currency: "USD" },
  { account: "Cash", balance: 4500000, currency: "CDF" },
];
