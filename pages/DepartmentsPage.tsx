
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
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
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [isImporting, setIsImporting] = useState(false);

  const categories = ['Tous', 'Spiritualité', 'Culte', 'Social', 'Opérations', 'Famille', 'Formation', 'Administration', 'Technique', 'Logistique', 'Jeunesse'];

  const handleFixData = async () => {
    if (!window.confirm("Attention: Cette action va réinitialiser et importer tous les départements et leaders officiels. Voulez-vous continuer ?")) return;

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
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary font-display tracking-tight leading-none mb-3 uppercase italic">Hub des 29 Départements</h2>
          <p className="text-slate-500 font-medium italic opacity-80 uppercase tracking-widest text-[10px]">Structure Opérationnelle NCD La Pentecôte</p>
        </div>
        <div className="flex gap-4">
          <PermissionGuard permission="MANAGE_DEPARTMENTS">
            <Button onClick={() => setIsAddDeptModalOpen(true)} className="rounded-[2rem] shadow-premium px-10 py-4 bg-primary text-white">
              <PlusCircleIcon className="w-5 h-5 mr-3" />
              Créer un Pôle
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar Catégories */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 ml-6">Filtrer par Pôle</h3>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full flex justify-between items-center px-8 py-5 rounded-[2rem] transition-all text-left group shadow-sm border-2 ${activeCategory === cat ? 'bg-primary border-primary text-white' : 'bg-white hover:bg-slate-50 border-transparent hover:border-indigo-100'}`}
            >
              <span className={`text-xs font-black uppercase tracking-widest ${activeCategory === cat ? 'text-white' : 'text-slate-600 group-hover:text-primary'}`}>{cat}</span>
              <Badge variant="outline" className={`text-[10px] font-black px-3 py-1 ${activeCategory === cat ? 'bg-white/10 text-white border-white/20' : 'bg-slate-50'}`}>
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
    </PageTransition>
  );
};

export default DepartmentsPage;
