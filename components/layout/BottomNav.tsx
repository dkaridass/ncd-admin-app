
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  ClipboardListIcon,
  MenuIcon,
  DollarSignIcon,
  MessageSquareIcon,
  FileTextIcon,
  HeartIcon,
  SparklesIcon,
  ShieldIcon
} from '../icons/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/DataContext';

const BottomNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { hasPermission } = useData();
  const location = useLocation();

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex flex-col items-center justify-center w-full py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${isActive ? 'text-primary dark:text-gold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
    }`;

  const menuItems = [
    { to: '/assistant', label: 'IA Assistant', icon: SparklesIcon, color: 'text-amber-500', permission: 'ACCESS_AI_CONFIG' },
    { to: '/sunday-overview', label: 'Synthèse Cultes', icon: CalendarIcon, color: 'text-purple-500', permission: 'VIEW_FINANCES' },
    { to: '/finances', label: 'Finances', icon: DollarSignIcon, color: 'text-emerald-600', permission: 'VIEW_FINANCES' },
    { to: '/departments', label: 'Départements', icon: UsersIcon, color: 'text-indigo-600', permission: 'MANAGE_DEPARTMENTS' },
    { to: '/reports-admin', label: 'Rapports', icon: FileTextIcon, color: 'text-rose-600', permission: 'MANAGE_DEPARTMENTS' },
    { to: '/resources', label: 'Ressources', icon: FileTextIcon, color: 'text-slate-600', permission: 'MANAGE_RESOURCES' },
    { to: '/prayer-requests', label: 'Prières', icon: HeartIcon, color: 'text-rose-400', permission: 'VIEW_PASTORAL_CARE' },
    { to: '/settings', label: 'Paramètres', icon: ShieldIcon, color: 'text-slate-400', permission: 'MANAGE_SETTINGS' },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card dark:bg-card-dark border-t border-slate-100 dark:border-dark pb-safe z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        <div className="flex justify-around items-center h-16 px-2">
          <NavLink to="/dashboard" className={navLinkClasses}>
            <HomeIcon className="w-5 h-5 mb-1" />
            <span>Accueil</span>
          </NavLink>
          <NavLink to="/members" className={navLinkClasses}>
            <UsersIcon className="w-5 h-5 mb-1" />
            <span>Fidèles</span>
          </NavLink>
          <NavLink to="/events" className={navLinkClasses}>
            <CalendarIcon className="w-5 h-5 mb-1" />
            <span>Prog.</span>
          </NavLink>
          <NavLink to="/volunteers" className={navLinkClasses}>
            <ClipboardListIcon className="w-5 h-5 mb-1" />
            <span>Tâches</span>
          </NavLink>
          <button
            onClick={toggleMenu}
            className={`flex flex-col items-center justify-center w-full py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${isMenuOpen ? 'text-primary dark:text-gold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <MenuIcon className={`w-5 h-5 mb-1 transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} />
            <span>Plus</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/20  z-[60] md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-card dark:bg-card-dark rounded-t-[2.5rem] z-[70] md:hidden shadow-admin dark:shadow-none overflow-hidden border-t border-slate-50 dark:border-slate-700"
            >
              <div className="p-8 pb-24">
                <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-8" />

                <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] mb-8 text-center">Menu Direction</h3>

                <div className="grid grid-cols-3 gap-4">
                  {menuItems.map((item) => {
                    if (item.permission && !hasPermission(item.permission as any)) return null;

                    const isActive = location.pathname === item.to;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all ${isActive ? 'bg-primary/5 dark:bg-gold/10 border-2 border-primary/10 dark:border-gold/20' : 'bg-slate-50 dark:bg-white/5 border-2 border-transparent'}`}
                      >
                        <div className={`p-3 rounded-lg bg-white dark:bg-white/10 shadow-sm dark:shadow-none mb-3 ${item.color}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider text-center ${isActive ? 'text-primary dark:text-gold' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.label}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>

                <div className="mt-10 pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">NCD Lubumbashi • Administration</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomNav;
