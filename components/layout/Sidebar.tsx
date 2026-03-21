
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { HomeIcon, UsersIcon, CalendarIcon, DollarSignIcon, MessageSquareIcon, FileTextIcon, ClipboardListIcon, HeartIcon, SparklesIcon } from '../icons/Icons';

const Sidebar: React.FC = () => {
  const { currentUser, hasPermission } = useData();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [churchName, setChurchName] = useState('NCD La Pentecôte');

  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('ncd_church_info');
      if (saved) {
        try {
          const info = JSON.parse(saved);
          if (info.name) setChurchName(info.name);
        } catch (e) { }
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 mt-1 text-sm font-medium transition-all duration-300 transform rounded-xl relative z-10 ${isActive
      ? 'bg-gradient-to-r from-white/10 dark:from-white/5 to-transparent text-white dark:text-white shadow-sm border-l-[3px] border-secondary translate-x-1'
      : 'text-blue-200 dark:text-slate-400 hover:bg-white/5 dark:hover:bg-card-darkHover hover:text-white dark:hover:text-slate-200 hover:translate-x-1'
    }`;

  return (
    <div className={`hidden md:flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} bg-primary dark:bg-[#070B14] text-white shadow-xl dark:shadow-none z-20 relative overflow-hidden border-r border-white/5 dark:border-dark transition-all duration-300`}>
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" />

      {/* Logo Header */}
      <div className={`flex flex-col items-center justify-center ${isCollapsed ? 'h-24 px-2' : 'h-52 px-6 pt-6 pb-4'} border-b border-white/10 bg-primary-dark/20 relative z-10 backdrop-blur-sm transition-all duration-300`}>
        <div className={`${isCollapsed ? 'w-12 h-12' : 'w-28 h-28'} rounded-full bg-white flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.2)] border-[3px] border-white/40 transition-all duration-300 shrink-0`}>
          <img src="/logo.png" alt="NCD Logo" className={`${isCollapsed ? 'w-8 h-8' : 'w-16 h-16'} object-contain transition-all duration-300`} />
        </div>
        <h1 className={`mt-4 text-[15px] font-bold text-white font-serif tracking-wide text-center whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 mt-0' : 'max-w-[200px] opacity-100'}`}>{churchName}</h1>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-3 -right-3 z-30 w-6 h-6 bg-white dark:bg-surface-dark rounded-full shadow-md dark:shadow-none border border-slate-200 dark:border-dark flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-gold hover:scale-110 transition-all"
        title={isCollapsed ? 'Agrandir' : 'Réduire'}
      >
        <svg className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-1 overflow-y-auto relative z-10 custom-scrollbar transition-all duration-300`}>
        <NavLink to="/dashboard" className={navLinkClasses} title={t('nav.dashboard')}>
          <HomeIcon className="w-5 h-5 opacity-90 shrink-0" />
          <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.dashboard')}</span>
        </NavLink>

        {hasPermission('VIEW_FINANCES') && (
          <NavLink to="/sunday-overview" className={navLinkClasses} title="Synthèse Cultes">
            <CalendarIcon className="w-5 h-5 opacity-90 shrink-0" />
            <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>Synthèse Cultes</span>
          </NavLink>
        )}

        <NavLink to="/assistant" className={navLinkClasses} title="Assistant IA">
          <SparklesIcon className="w-5 h-5 opacity-90 shrink-0" />
          <span className={`mx-3 font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>Assistant IA</span>
        </NavLink>

        <div className={`pt-4 pb-2 px-4 text-[10px] font-black text-blue-300/70 uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 !p-0 !h-0' : 'max-w-[200px] opacity-100'}`}>Ministère</div>
        <div className={`pt-3 border-t border-white/10 mt-3 transition-all duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0 !h-0 !m-0 border-transparent'}`} />

        {hasPermission('VIEW_MEMBERS') && (
          <NavLink to="/members" className={navLinkClasses} title={t('nav.members')}>
            <UsersIcon className="w-5 h-5 opacity-90 shrink-0" />
            <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.members')}</span>
          </NavLink>
        )}

        {hasPermission('VIEW_DEPARTMENTS') && (
          <NavLink to="/departments" className={navLinkClasses} title={t('nav.departments')}>
            <UsersIcon className="w-5 h-5 opacity-90 shrink-0" />
            <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.departments')}</span>
          </NavLink>
        )}

        {hasPermission('MANAGE_DEPARTMENTS') && (
          <NavLink to="/reports-admin" className={navLinkClasses} title="Rapports">
            <FileTextIcon className="w-5 h-5 opacity-90 shrink-0" />
            <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>Rapports</span>
          </NavLink>
        )}

        <NavLink to="/events" className={navLinkClasses} title={t('nav.events')}>
          <CalendarIcon className="w-5 h-5 opacity-90 shrink-0" />
          <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.events')}</span>
        </NavLink>

        <NavLink to="/attendance" className={navLinkClasses} title={t('nav.attendance')}>
          <UsersIcon className="w-5 h-5 opacity-90 shrink-0" />
          <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.attendance')}</span>
        </NavLink>

        <NavLink to="/volunteers" className={navLinkClasses} title="Bénévoles">
          <ClipboardListIcon className="w-5 h-5 opacity-90 shrink-0" />
          <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>Bénévoles</span>
        </NavLink>

        <NavLink to="/prayer-requests" className={navLinkClasses} title="Requêtes Prière">
          <HeartIcon className="w-5 h-5 opacity-90 shrink-0" />
          <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>Requêtes Prière</span>
        </NavLink>

        <div className={`pt-4 pb-2 px-4 text-[10px] font-black text-blue-300/70 uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0 !p-0 !h-0' : 'max-w-[200px] opacity-100'}`}>Gestion</div>
        <div className={`pt-3 border-t border-white/10 mt-3 transition-all duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0 !h-0 !m-0 border-transparent'}`} />

        {hasPermission('VIEW_FINANCES') && (
          <NavLink to="/finances" className={navLinkClasses} title={t('nav.finances')}>
            <DollarSignIcon className="w-5 h-5 opacity-90 shrink-0" />
            <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.finances')}</span>
          </NavLink>
        )}

        <NavLink to="/communications" className={navLinkClasses} title={t('nav.communications')}>
          <MessageSquareIcon className="w-5 h-5 opacity-90 shrink-0" />
          <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.communications')}</span>
        </NavLink>

        <NavLink to="/resources" className={navLinkClasses} title={t('nav.resources')}>
          <FileTextIcon className="w-5 h-5 opacity-90 shrink-0" />
          <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.resources')}</span>
        </NavLink>

        {hasPermission('MANAGE_SETTINGS') && (
          <NavLink to="/documents" className={navLinkClasses} title="Documents">
            <ClipboardListIcon className="w-5 h-5 opacity-90 shrink-0" />
            <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>Documents</span>
          </NavLink>
        )}

        {hasPermission('MANAGE_ROLES') && (
          <NavLink to="/users" className={navLinkClasses} title={t('nav.roles')}>
            <UsersIcon className="w-5 h-5 opacity-90 shrink-0" />
            <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.roles')}</span>
          </NavLink>
        )}

        {hasPermission('MANAGE_SETTINGS') && (
          <NavLink to="/settings" className={navLinkClasses} title={t('nav.settings')}>
            <svg className="w-5 h-5 opacity-90 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className={`mx-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>{t('nav.settings')}</span>
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} bg-primary-dark/30 border-t border-white/10 relative z-10 backdrop-blur-md transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs overflow-hidden ring-2 ring-white/10 shrink-0">
            {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="Avatar" /> : currentUser?.name?.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="text-xs truncate flex-1">
              <p className="font-bold text-white truncate font-display">{currentUser?.name || "Invité"}</p>
              <p className="text-blue-300 uppercase text-[9px] tracking-wider font-bold">{currentUser?.role || "Membre"}</p>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl bg-card dark:bg-card-dark hover:bg-card dark:bg-card-dark flex items-center justify-center transition-all duration-300 group shrink-0"
            title={isDark ? 'Mode Clair' : 'Mode Sombre'}
          >
            {isDark ? (
              <svg className="w-4 h-4 text-gold group-hover:text-gold-light transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-blue-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
