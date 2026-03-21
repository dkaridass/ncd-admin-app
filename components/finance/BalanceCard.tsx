import React from 'react';
import { FinanceAccount, Currency } from '../../types';

export interface BalanceCardItem {
  account: FinanceAccount;
  balance: number;
  currency: Currency;
}

export interface BrandConfigItem {
  bg: string;
  textColor: string;
  subTextColor: string;
  logoTheme: 'dark' | 'light';
  name: string;
  logo: string | null;
}

/**
 * Brand-accurate config: official hex codes per bank.
 * Contrast: Rawbank & Orange Money → dark text; others → white text.
 * logoTheme "dark" = use black/dark logo (no invert); "light" = invert to white.
 */
const brandConfig: Record<FinanceAccount, BrandConfigItem> = {
  Rawbank: {
    bg: 'bg-[#FFCC00]',
    textColor: 'text-gray-900',
    subTextColor: 'text-gray-800',
    logoTheme: 'dark',
    name: 'Rawbank',
    logo: '/logos/rawbank.png',
  },
  OrangeMoney: {
    bg: 'bg-[#FF7900]',
    textColor: 'text-gray-900',
    subTextColor: 'text-gray-800',
    logoTheme: 'dark',
    name: 'Orange Money',
    logo: '/logos/orange.png',
  },
  Equity: {
    bg: 'bg-[#8B2229]',
    textColor: 'text-white',
    subTextColor: 'text-white/80',
    logoTheme: 'light',
    name: 'Equity BCDC',
    logo: '/logos/equity.png',
  },
  Mpesa: {
    bg: 'bg-[#E60000]',
    textColor: 'text-white',
    subTextColor: 'text-white/80',
    logoTheme: 'light',
    name: 'M-Pesa',
    logo: '/logos/mpesa.png',
  },
  PayPal: {
    bg: 'bg-[#003087]',
    textColor: 'text-white',
    subTextColor: 'text-white/80',
    logoTheme: 'light',
    name: 'PayPal',
    logo: '/logos/paypal.png',
  },
  MoneyGram: {
    bg: 'bg-[#DA291C]',
    textColor: 'text-white',
    subTextColor: 'text-white/80',
    logoTheme: 'light',
    name: 'MoneyGram',
    logo: '/logos/moneygram.png',
  },
  Cash: {
    bg: 'bg-[#10B981]',
    textColor: 'text-white',
    subTextColor: 'text-white/80',
    logoTheme: 'light',
    name: 'Cash',
    logo: null,
  },
};

// SVG Noise (3% opacity)
const NoiseTexture: React.FC = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none rounded-3xl"
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
);

function formatBalance(balance: number, currency: Currency): string {
  if (currency === 'USD') {
    return `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `FC ${balance.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatCurrencySubtext(currency: Currency): string {
  return currency === 'USD' ? 'Dollars Américains' : 'Francs Congolais';
}

export interface BalanceCardProps {
  item: BalanceCardItem;
  className?: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ item, className = '' }) => {
  const config = brandConfig[item.account];
  const formatted = formatBalance(item.balance, item.currency);
  const subtext = formatCurrencySubtext(item.currency);
  const useDarkLogo = config.logoTheme === 'dark';

  return (
    <div
      className={`${config.bg} ${config.textColor} relative rounded-3xl overflow-hidden shadow-xl dark:shadow-none hover:shadow-2xl dark:shadow-none transition-all duration-300 flex-shrink-0 w-[85%] min-w-[280px] sm:w-[320px] sm:min-w-[320px] ${className}`}
      style={{ aspectRatio: '1.586 / 1' }}
    >
      <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full border-t border-l border-white/20 rounded-tl-3xl pointer-events-none" />
      <NoiseTexture />

      <div className="relative z-10 h-full p-6 flex flex-col justify-between">
        {/* Top: Logo top-right (Apple Wallet style); dark theme = no invert, light = invert */}
        <div className="flex items-start justify-between">
          <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${config.textColor} opacity-90`}>
            {config.name}
          </span>
          {config.logo ? (
            <div className="h-10 w-auto max-w-[120px] flex items-center justify-end">
              <img
                src={config.logo}
                alt={config.name}
                className={`h-full w-auto object-contain object-right ${useDarkLogo ? '' : 'brightness-0 invert'}`}
              />
            </div>
          ) : (
            <div className={`px-3 py-1.5 rounded-xl border ${useDarkLogo ? 'bg-black/10 border-gray-800/30' : 'bg-card dark:bg-card-dark border-white/20 backdrop-blur-sm'}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${config.textColor}`}>{config.name}</span>
            </div>
          )}
        </div>

        {/* Center: Balance — large, bold */}
        <div className="flex-1 flex items-center justify-center my-2">
          <p className={`text-2xl md:text-3xl font-sans font-bold tracking-tight leading-none ${config.textColor}`}>
            {formatted}
          </p>
        </div>

        {/* Bottom: SOLDE DISPONIBLE + currency — subTextColor for contrast */}
        <div>
          <p className={`text-[10px] font-medium uppercase tracking-[0.2em] ${config.textColor} opacity-80 mb-0.5`}>
            Solde Disponible
          </p>
          <p className={`text-[9px] font-medium uppercase tracking-wider ${config.subTextColor}`}>
            {subtext}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
