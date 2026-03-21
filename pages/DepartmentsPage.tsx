
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import PageTransition from '../components/layout/PageTransition';
import PermissionGuard from '../components/auth/PermissionGuard';
import { PlusCircleIcon } from '../components/icons/Icons';
import { Department } from '../types';
import DepartmentCard from '../components/departments/DepartmentCard';
import DepartmentDashboard from '../components/departments/DepartmentDashboard';

import { db } from '../firebase';
import { importDepartmentsAndLeaders } from '../utils/importDepartments';
import AddDepartmentModal from '../components/departments/AddDepartmentModal';

const DepartmentsPage: React.FC = () => {
  const { departments, hasPermission } = useData();
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [isImporting, setIsImporting] = useState(false);
  const { confirmState, confirm, cancelConfirm } = useConfirm();

  const categories = ['Tous', 'Spiritualité', 'Culte', 'Social', 'Opérations', 'Famille', 'Formation', 'Administration', 'Technique', 'Logistique', 'Jeunesse'];

  const handleFixData = async () => {
    const accepted = await confirm({
      title: 'Réinitialiser les départements ?',
      message: 'Cette action va réinitialiser et importer tous les départements et leaders officiels. Les données existantes seront écrasées.',
      confirmLabel: 'Importer',
      variant: 'warning',
    });
    if (!accepted) return;

    setIsImporting(true);

    // Create a temporary toast/notification manually since we don't have a toast system yet
    const notif = document.createElement('div');
    notif.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] font-bold animate-bounce';
    notif.innerText = '🔄 Importation des Départements & Leaders en cours...';
    document.body.appendChild(notif);

    try {
      const count = await importDepartmentsAndLeaders(db);

      notif.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] font-bold';
      notif.innerText = `✅ Succès ! ${count} départements importés. Actualisation...`;

      // Delay reload to let user read
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e: any) {
      console.error(e);
      notif.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] font-bold';
      notif.innerText = `❌ Erreur : ${e.message || 'Inconnue'}`;
      // Increase timeout so user can read it
      setTimeout(() => notif.remove(), 10000);
      setIsImporting(false);
    }
  };

  const handleOpenReportHub = (dept: Department) => {
    setSelectedDept(dept);
    setIsReportModalOpen(true);
  };

  const filteredDepartments = activeCategory === 'Tous'
    ? departments
    : departments.filter(d => d.category === activeCategory);

  // Check if department meets today
  const isMeetingToday = (department: Department) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDay = days[new Date().getDay()];

    if (department.meetingDays && department.meetingDays.length > 0) {
      return department.meetingDays.some(d => d.includes(currentDay));
    }

    if (department.meetingDay) {
      return department.meetingDay.includes(currentDay) || department.meetingDay === 'Lundi à Samedi';
    }
    return false;
  };

  return (
    <PageTransition>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12 gap-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary dark:text-white font-display tracking-tight leading-none mb-3 uppercase italic">Hub des 29 Départements</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic opacity-80 uppercase tracking-widest text-[10px]">Structure Opérationnelle NCD La Pentecôte</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="lg:hidden flex-1 flex items-center justify-center rounded-[2rem] border-2 border-slate-200 dark:border-dark text-slate-500 hover:text-primary transition-colors py-4 text-[10px] font-black uppercase tracking-widest"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Catégories ({activeCategory})
          </button>
          <PermissionGuard permission="MANAGE_DEPARTMENTS">
            <Button onClick={() => setIsAddDeptModalOpen(true)} className="flex-1 rounded-[2rem] shadow-premium dark:shadow-none px-6 md:px-10 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              <PlusCircleIcon className="w-4 h-4 mr-2" />
              Créer un Pôle
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Desktop Sidebar Catégories */}
        <div className="hidden lg:block lg:col-span-1 space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 ml-6">Filtrer par Pôle</h3>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full flex justify-between items-center px-8 py-5 rounded-[2rem] transition-all text-left group shadow-sm dark:shadow-none border-2 ${activeCategory === cat ? 'bg-primary border-primary dark:border-white/20 text-white' : 'bg-card dark:bg-card-dark hover:bg-slate-50 border-transparent hover:border-indigo-100'}`}
            >
              <span className={`text-xs font-black uppercase tracking-widest ${activeCategory === cat ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'}`}>{cat}</span>
              <Badge variant="outline" className={`text-[10px] font-black px-3 py-1 ${activeCategory === cat ? 'bg-card dark:bg-card-dark text-white border-white/20' : 'bg-slate-50'}`}>
                {cat === 'Tous' ? departments.length : departments.filter(d => d.category === cat).length}
              </Badge>
            </button>
          ))}
        </div>

        {/* Grille Départements */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in w-full">
          {filteredDepartments.map(dept => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onClick={handleOpenReportHub}
              isMeetingToday={isMeetingToday(dept)}
            />
          ))}
        </div>
      </div>

      <DepartmentDashboard
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        department={selectedDept}
      />

      <AddDepartmentModal
        isOpen={isAddDeptModalOpen}
        onClose={() => setIsAddDeptModalOpen(false)}
      />

      {/* Mobile Filter Bottom Sheet */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center lg:hidden">
          <div
            className="absolute inset-0 bg-primary/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFilterModalOpen(false)}
          />
          <div className="bg-card dark:bg-card-dark rounded-t-[2rem] w-full p-6 relative z-10 animate-fade-in border-t border-slate-100 dark:border-dark shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

            <h3 className="text-xl font-bold font-display text-primary dark:text-white mb-6">Filtrer par Pôle</h3>

            <div className="space-y-3 mb-8">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setIsFilterModalOpen(false);
                  }}
                  className={`w-full flex justify-between items-center px-6 py-4 rounded-2xl transition-all text-left border-2 ${activeCategory === cat ? 'bg-primary border-primary text-white' : 'bg-slate-50 dark:bg-white/[0.02] border-transparent text-slate-600 dark:text-slate-400'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{cat}</span>
                  <Badge variant="outline" className={`text-[9px] font-black px-2 py-0.5 ${activeCategory === cat ? 'text-white border-white/20' : ''}`}>
                    {cat === 'Tous' ? departments.length : departments.filter(d => d.category === cat).length}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog {...confirmState} onCancel={cancelConfirm} />
    </PageTransition>
  );
};

export default DepartmentsPage;
