
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onLogout }) => {
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
