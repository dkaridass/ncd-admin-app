import React from 'react';
import { useAccountBalances } from '../../hooks/useAccountBalances';
import AccountsGrid from './AccountsGrid';

interface AccountBalancesStripProps {
  className?: string;
}

/**
 * Account balances strip — 100% backend-driven (Firestore finances).
 * Uses useAccountBalances → financeRecords from DataContext.
 * No mock data. Loading → skeletons; error → small banner.
 */
const AccountBalancesStrip: React.FC<AccountBalancesStripProps> = ({
  className = '',
}) => {
  const { items, isLoading, error } = useAccountBalances();

  return (
    <div className={`w-full ${className}`}>
      {error && (
        <p
          className="mb-4 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg px-4 py-3"
          role="alert"
        >
          Erreur de chargement des soldes. {error}
        </p>
      )}
      <AccountsGrid items={items} isLoading={isLoading} />
    </div>
  );
};

export default AccountBalancesStrip;
