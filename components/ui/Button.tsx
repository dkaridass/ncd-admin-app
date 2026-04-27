
import React, { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-current transform active:scale-[0.98] focus:outline-none';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-border hover:bg-slate-50 shadow-sm',
    danger: 'bg-secondary text-white hover:bg-red-700 shadow-sm',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    white: 'bg-white text-slate-700 border border-border hover:bg-slate-50 shadow-sm',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs rounded-md',
    md: 'px-6 py-3 text-sm rounded-md',
    lg: 'px-8 py-4 text-base rounded-md',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Traitement...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
