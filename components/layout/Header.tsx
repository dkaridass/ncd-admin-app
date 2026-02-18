
import React, { useState, useEffect } from 'react';
import { LogOutIcon, UserIcon, SparklesIcon } from '../icons/Icons';
import { useData } from '../../context/DataContext';
import Button from '../ui/Button';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { currentUser, logout, isLoading } = useData();
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  useEffect(() => {
    if (isLoading) {
      setSyncStatus('syncing');
    } else {
      const timer = setTimeout(() => setSyncStatus('synced'), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <header className="flex items-center justify-between h-20 px-4 md:px-8 glass-effect border-b border-white/40 sticky top-0 z-40 shrink-0 shadow-sm">
      <div className="flex items-center gap-3 md:gap-6">
         <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-slate-100/40 rounded-2xl border border-slate-200/30 group hover:border-primary/30 transition-all cursor-pointer">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Rechercher</span>
         </div>
         
         <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-green-500'} shadow-[0_0_8px_rgba(34,197,94,0.4)]`}></div>
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[120px] md:max-w-none">
                    {syncStatus === 'syncing' ? 'Synchro...' : 'Connecté • Lubumbashi'}
                </span>
            </div>
            <div className="mt-0.5 hidden sm:block">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-secondary">Thème 2026 : Focus sur Jésus</span>
            </div>
         </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center px-2 md:px-4 py-2 rounded-2xl hover:bg-slate-50/80 transition-all cursor-pointer group">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center text-white overflow-hidden shadow-premium group-hover:rotate-6 transition-transform">
              {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="User" /> : <UserIcon className="w-5 h-5 md:w-6 md:h-6" />}
          </div>
          <div className="ml-3 hidden md:block text-left">
            <p className="text-sm font-black text-primary leading-none font-display uppercase tracking-tight">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-[0.2em]">{currentUser?.role}</p>
          </div>
        </div>
        
        <div className="h-6 w-px bg-slate-200/50 mx-1 hidden sm:block"></div>
        
        <Button onClick={handleLogout} variant="ghost" size="sm" className="rounded-xl hover:bg-red-50 hover:text-red-600 text-slate-400 p-2">
          <LogOutIcon className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
