
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
      className={`${!hasBg ? 'bg-card' : ''} rounded-xl border border-slate-200 shadow-premium overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
    >
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          {title && <h3 className="text-xs font-bold text-primary uppercase tracking-widest">{title}</h3>}
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
