import React from 'react';

/**
 * Loading skeleton for BalanceCard. Same dimensions (1.586 aspect, 320px width).
 */
const BalanceCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`flex-shrink-0 w-[85%] min-w-[280px] sm:w-[320px] sm:min-w-[320px] rounded-lg overflow-hidden bg-slate-200 animate-pulse ${className}`}
    style={{ aspectRatio: '1.586 / 1' }}
  >
    <div className="h-full p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="h-3 w-20 rounded bg-slate-300" />
        <div className="h-8 w-24 rounded-lg bg-slate-300" />
      </div>
      <div className="flex-1 flex items-center justify-center my-2">
        <div className="h-8 w-32 rounded bg-slate-300" />
      </div>
      <div>
        <div className="h-2.5 w-28 rounded bg-slate-300 mb-2" />
        <div className="h-2 w-24 rounded bg-slate-300" />
      </div>
    </div>
  </div>
);

export default BalanceCardSkeleton;
