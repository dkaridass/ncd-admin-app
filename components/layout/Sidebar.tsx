
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { HomeIcon, UsersIcon, CalendarIcon, DollarSignIcon, MessageSquareIcon, FileTextIcon, ClipboardListIcon, HeartIcon, SparklesIcon } from '../icons/Icons';

const Sidebar: React.FC = () => {
  const { currentUser, hasPermission } = useData();

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center px-4 py-3 mt-1 text-sm font-medium transition-all duration-200 transform rounded-xl relative z-10 ${isActive
      ? 'bg-secondary text-white shadow-lg shadow-secondary/30 translate-x-1'
      : 'text-blue-200 hover:bg-white/5 hover:text-white hover:translate-x-1'
    }`;

  return (
    <div className="hidden md:flex flex-col w-64 bg-primary text-white shadow-xl z-20 relative overflow-hidden border-r border-white/5">
      {/* Cinematic Background Glows - Visual Continuity with Dashboard */}
      {/* Cinematic Background Glows - Visual Continuity with Dashboard */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Clean Cathedral Look: Removed Neon Glows */}
      </div>

      <div className="flex flex-col items-center justify-center h-36 px-6 border-b border-white/10 bg-primary-dark/20 relative z-10 backdrop-blur-sm">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1 mb-3 shadow-2xl ring-4 ring-white/10">
          <img src="/logo.png" alt="NCD Logo" className="w-full h-full object-contain rounded-full" />
        </div>
        <h1 className="text-sm font-bold tracking-tight text-white font-serif tracking-wide text-center">NCD La Pentecôte</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto relative z-10 custom-scrollbar">
        <NavLink to="/dashboard" className={navLinkClasses}>
          <HomeIcon className="w-5 h-5 opacity-90" />
          <span className="mx-3">Tableau de bord</span>
        </NavLink>

        {hasPermission('VIEW_FINANCES') && (
          <NavLink to="/sunday-overview" className={navLinkClasses}>
            <CalendarIcon className="w-5 h-5 opacity-90" />
            <span className="mx-3">Synthèse Cultes</span>
          </NavLink>
        )}

        <NavLink to="/assistant" className={`${navLinkClasses} hover:text-secondary-light`}>
          <SparklesIcon className="w-5 h-5 opacity-90" />
          <span className="mx-3 font-bold">Assistant IA</span>
        </NavLink>

        <div className="pt-4 pb-2 px-4 text-[10px] font-black text-blue-300/70 uppercase tracking-[0.2em]">Ministère</div>

        {hasPermission('VIEW_MEMBERS') && (
          <NavLink to="/members" className={navLinkClasses}>
            <UsersIcon className="w-5 h-5 opacity-90" />
            <span className="mx-3">Membres</span>
          </NavLink>
        )}

        {hasPermission('VIEW_DEPARTMENTS') && (
          <NavLink to="/departments" className={navLinkClasses}>
            <UsersIcon className="w-5 h-5 opacity-90" />
            <span className="mx-3">Départements</span>
          </NavLink>
        )}

        {hasPermission('MANAGE_DEPARTMENTS') && (
          <NavLink to="/reports-admin" className={navLinkClasses}>
            <FileTextIcon className="w-5 h-5 opacity-90" />
            <span className="mx-3">Rapports</span>
          </NavLink>
        )}

        <NavLink to="/events" className={navLinkClasses}>
          <CalendarIcon className="w-5 h-5 opacity-90" />
          <span className="mx-3">Programme</span>
        </NavLink>

        <NavLink to="/attendance" className={navLinkClasses}>
          <UsersIcon className="w-5 h-5 opacity-90" />
          <span className="mx-3">Présences</span>
        </NavLink>

        <NavLink to="/volunteers" className={navLinkClasses}>
          <ClipboardListIcon className="w-5 h-5 opacity-90" />
          <span className="mx-3">Bénévoles</span>
        </NavLink>

        <NavLink to="/prayer-requests" className={navLinkClasses}>
          <HeartIcon className="w-5 h-5 opacity-90" />
          <span className="mx-3">Requêtes Prière</span>
        </NavLink>

        <div className="pt-4 pb-2 px-4 text-[10px] font-black text-blue-300/70 uppercase tracking-[0.2em]">Gestion</div>

        {hasPermission('VIEW_FINANCES') && (
          <NavLink to="/finances" className={navLinkClasses}>
            <DollarSignIcon className="w-5 h-5 opacity-90" />
            <span className="mx-3">Finances</span>
          </NavLink>
        )}

        <NavLink to="/communications" className={navLinkClasses}>
          <MessageSquareIcon className="w-5 h-5 opacity-90" />
          <span className="mx-3">Annonces</span>
        </NavLink>
        <NavLink to="/resources" className={navLinkClasses}>
          <FileTextIcon className="w-5 h-5 opacity-90" />
          <span className="mx-3">Ressources</span>
        </NavLink>

        {/* Users Management (Super Admin Only) */}
        {hasPermission('MANAGE_ROLES') && (
          <NavLink to="/users" className={navLinkClasses}>
            <UsersIcon className="w-5 h-5 opacity-90" />
            <span className="mx-3">Utilisateurs</span>
          </NavLink>
        )}

        {hasPermission('MANAGE_SETTINGS') && (
          <NavLink to="/settings" className={navLinkClasses}>
            <svg className="w-5 h-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="mx-3">Paramètres</span>
          </NavLink>
        )}
      </nav>
      <div className="p-4 bg-primary-dark/30 border-t border-white/10 relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs overflow-hidden ring-2 ring-white/10">
            {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="Avatar" /> : currentUser?.name?.charAt(0)}
          </div>
          <div className="text-xs truncate">
            <p className="font-bold text-white truncate font-display">{currentUser?.name || "Invité"}</p>
            <p className="text-blue-300 uppercase text-[9px] tracking-wider font-bold">{currentUser?.role || "Membre"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
