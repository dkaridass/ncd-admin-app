
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`block w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs md:text-sm transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
