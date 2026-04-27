
import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 md:px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 "
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card dark:bg-card-dark rounded-t-[2rem] md:rounded-lg shadow-admin dark:shadow-none w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar relative z-10 border border-slate-100 dark:border-slate-700"
          >
            <div className="flex justify-between items-center px-6 py-4 md:px-8 md:py-6 border-b border-slate-50 dark:border-slate-700">
              <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-primary dark:text-gold">{title}</h3>
              <button onClick={onClose} className="text-slate-300 dark:text-slate-600 hover:text-primary dark:hover:text-white transition-colors text-2xl font-light">&times;</button>
            </div>
            <div className="p-6 md:p-8">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
