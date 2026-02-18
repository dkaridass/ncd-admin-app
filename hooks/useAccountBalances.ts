import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { FinanceAccount, Currency } from '../types';
import type { BalanceCardItem } from '../components/finance/BalanceCard';

const ACCOUNT_ORDER: FinanceAccount[] = [
  'Rawbank',
  'OrangeMoney',
  'PayPal',
  'MoneyGram',
  'Mpesa',
  'Equity',
  'Cash',
];

/** Primary currency per account (matches real usage). */
const PRIMARY_CURRENCY: Record<FinanceAccount, Currency> = {
  Rawbank: 'USD',
  Equity: 'USD',
  PayPal: 'USD',
  MoneyGram: 'USD',
  OrangeMoney: 'CDF',
  Mpesa: 'CDF',
  Cash: 'CDF',
};

/**
 * Computes account balances from Firestore finance records.
 * Same logic as FinancesPage: inflows add, Dépense subtracts, per account and currency.
 */
function computeBalances(
  financeRecords: { account?: FinanceAccount; type?: string; currency?: Currency; amount?: number }[]
): Record<FinanceAccount, { cdf: number; usd: number }> {
  const balances: Record<FinanceAccount, { cdf: number; usd: number }> = {
    Rawbank: { cdf: 0, usd: 0 },
    Equity: { cdf: 0, usd: 0 },
    PayPal: { cdf: 0, usd: 0 },
    Mpesa: { cdf: 0, usd: 0 },
    OrangeMoney: { cdf: 0, usd: 0 },
    MoneyGram: { cdf: 0, usd: 0 },
    Cash: { cdf: 0, usd: 0 },
  };

  const list = Array.isArray(financeRecords) ? financeRecords : [];
  list.forEach((r) => {
    const acc = (r.account || 'Cash') as FinanceAccount;
    if (!balances[acc]) return;
    const cur = r.currency === 'USD' ? 'usd' : 'cdf';
    const delta = r.type === 'Dépense' ? -(r.amount ?? 0) : (r.amount ?? 0);
    balances[acc][cur] += delta;
  });

  return balances;
}

export interface UseAccountBalancesResult {
  items: BalanceCardItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that derives balance card data from Firestore finance records.
 * No mock data — 100% backend-driven.
 */
export function useAccountBalances(): UseAccountBalancesResult {
  const {
    financeRecords,
    financeError,
    financeSnapshotReceived,
  } = useData();

  const items = useMemo(() => {
    const balances = computeBalances(financeRecords ?? []);
    return ACCOUNT_ORDER.map((account) => {
      const cur = PRIMARY_CURRENCY[account];
      const value = cur === 'USD' ? balances[account].usd : balances[account].cdf;
      return {
        account,
        balance: value,
        currency: cur,
      } as BalanceCardItem;
    });
  }, [financeRecords]);

  const isLoading = !financeSnapshotReceived;
  const error = financeError ?? null;

  return { items, isLoading, error };
}
