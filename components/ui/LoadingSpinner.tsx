import React from 'react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary dark:border-white/20/20 border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Chargement...</p>
        </div>
    );
};

export default LoadingSpinner;
