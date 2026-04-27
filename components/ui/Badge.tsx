
import React, { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'badge bg-slate-100 text-slate-800',
    primary: 'badge bg-blue-100 text-blue-800',
    success: 'badge badge-success',
    warning: 'badge badge-pending',
    danger: 'badge badge-danger',
    outline: 'badge bg-transparent border border-border text-slate-600',
  };

  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
