
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
  noPadding?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actions, noPadding = false, onClick }) => {
  const hasBg = className.includes('bg-');

  return (
    <div
      onClick={onClick}
      className={`${!hasBg ? 'bg-card dark:bg-card-dark' : ''} rounded-[2rem] border border-slate-200 dark:border-transparent dark:ring-1 dark:ring-white/5 shadow-premium dark:shadow-none overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
    >
      {(title || actions) && (
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
          {title && <h3 className="text-xs font-bold text-primary dark:text-gold uppercase tracking-widest">{title}</h3>}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6 md:p-8'}>
        {children}
      </div>
    </div>
  );
};

export default Card;
