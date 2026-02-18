import React from 'react';
import BalanceCard, { BalanceCardItem } from './BalanceCard';
import BalanceCardSkeleton from './BalanceCardSkeleton';

const ACCOUNT_ORDER = [
  'Rawbank',
  'OrangeMoney',
  'PayPal',
  'MoneyGram',
  'Mpesa',
  'Equity',
  'Cash',
] as const;

export interface AccountsGridProps {
  items: BalanceCardItem[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Apple Wallet–style horizontal carousel for account balance cards.
 * - overflow-x-auto + snap-x + snap-center, scrollbar-hide
 * - When isLoading, shows skeletons instead of cards (no mock 0s).
 */
const AccountsGrid: React.FC<AccountsGridProps> = ({
  items,
  isLoading = false,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
        role="list"
        aria-label="Soldes par compte"
      >
        {isLoading
          ? ACCOUNT_ORDER.map((account) => (
              <div
                key={account}
                role="listitem"
                className="snap-center flex-shrink-0 first:pl-0 last:pr-0"
              >
                <BalanceCardSkeleton />
              </div>
            ))
          : items.map((item) => (
              <div
                key={item.account}
                role="listitem"
                className="snap-center flex-shrink-0 first:pl-0 last:pr-0"
              >
                <BalanceCard item={item} />
              </div>
            ))}
      </div>
    </div>
  );
};

export default AccountsGrid;
