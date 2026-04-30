
import React, { ReactNode, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { authService } from '../../services/authService';

interface MainLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const MainLayout: React.FC<MainLayoutProps> = ({ children, onLogout }) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      authService.logout();
      window.location.href = '/';
    }, SESSION_TIMEOUT_MS);
  };

  useEffect(() => {
    // Setup event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout(); // Initialize the timeout

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, []);

  return (
    <div className="flex h-screen bg-surface dark:bg-surface-dark text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header onLogout={onLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface dark:bg-surface-dark transition-colors duration-300 pb-20 md:pb-0 scroll-smooth">
          <div className="container mx-auto px-4 py-6 md:px-8 md:py-8 max-w-7xl">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;
