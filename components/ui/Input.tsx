
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`block w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-gold/20 focus:border-primary dark:focus:border-gold text-xs md:text-sm transition-all shadow-sm dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:bg-slate-50 dark:disabled:bg-white/[0.02] disabled:text-slate-500 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
