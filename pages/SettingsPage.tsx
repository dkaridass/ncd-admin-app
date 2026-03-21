
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import PageTransition from '../components/layout/PageTransition';
import { useData, ROLE_PERMISSIONS } from '../context/DataContext';
import { api } from '../services/api';
import { AppRole, Permission } from '../types';
import PermissionGuard from '../components/auth/PermissionGuard';
import { ShieldIcon, UsersIcon, SparklesIcon } from '../components/icons/Icons';
import { ensureSuperAdminExists, isCurrentUserSuperAdminEmail } from '../utils/ensureSuperAdmin';
import { seedDatabase } from '../utils/seedDatabase';
import { loadRealChurchData } from '../utils/loadRealData';
import { showSuccess, showError, showInfo } from '../utils/toast';
import { useTranslation } from 'react-i18next';

const PERMISSION_LABELS: Record<Permission, string> = {
  VIEW_MEMBERS: "Voir les Membres",
  EDIT_MEMBERS: "Gérer les Membres",
  DELETE_MEMBERS: "Archiver les Membres",
  VIEW_FINANCES: "Consulter les Finances",
  CREATE_FINANCES: "Saisir les Finances",
  EDIT_FINANCES: "Modifier les Finances",
  DELETE_FINANCES: "Supprimer les Finances",
  VIEW_PASTORAL_CARE: "Accès Pastoral",
  VIEW_PRIVATE_PRAYERS: "Requêtes Confidentielles",
  VIEW_DEPARTMENTS: "Voir les Départements",
  MANAGE_DEPARTMENTS: "Gérer les Départements",
  MANAGE_SETTINGS: "Accès Paramètres",
  ACCESS_AI_CONFIG: "Configuration IA",
  MANAGE_TASKS: "Gérer les Tâches",
  MANAGE_ANNOUNCEMENTS: "Gérer les Annonces",
  MANAGE_RESOURCES: "Gérer les Ressources",
  MANAGE_ROLES: "Gérer les Rôles & Sécurité",
  MANAGE_EVENTS: "Gérer le Programme",
  MANAGE_DEPARTMENT_REPORTS: "Gérer les Rapports",
  SEND_MESSAGES: "Envoyer des Messages",
  MANAGE_TEMPLATES: "Gérer les Modèles"
};

const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Pasteur Principal",
  PASTOR: "Pasteur Associé",
  STAFF_ADMIN: "Secrétariat / Admin",
  SECRETARY: "Secrétaire",
  FINANCE_ADMIN: "Trésorerie",
  DEPT_LEADER: "Responsable Dept.",
  VOLUNTEER: "Bénévole",
  MEMBER: "Fidèle",
  VIEWER: "Observateur"
};

const SettingsPage: React.FC = () => {
  const { currentUser, logout, exportData, importData, resetDatabase, isLoading, hasPermission } = useData();
  const [activeTab, setActiveTab] = useState<'church' | 'security' | 'system'>('church');
  const [health, setHealth] = useState<any>(null);
  const { t, i18n } = useTranslation();
  const { confirmState, confirm, cancelConfirm } = useConfirm();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('ncd_lang', lng);
  };

  // Church State
  const [churchInfo, setChurchInfo] = useState(() => {
    const saved = localStorage.getItem('ncd_church_info');
    if (saved) return JSON.parse(saved);
    return {
      name: 'NCD La Pentecôte',
      city: 'Lubumbashi',
      pastor: 'Dr Jean-Clément Diambilay',
      email: 'contact@ncd.cd',
      serviceTimes: 'Dimanche 8h00, 10h30 | Mercredi 17h00 | Vendredi 17h00'
    };
  });

  // AI Config State
  const [aiConfig, setAiConfig] = useState({
    tone: 'Pastoral',
    formality: 'Soutenu',
    systemPrompt: 'Tu es un assistant administratif chrétien expert. Tes réponses doivent être concises, respectueuses et bibliquement alignées si nécessaire.'
  });

  useEffect(() => {
    api.system.checkHealth().then(setHealth);
  }, []);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ncd_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = importData(event.target?.result as string);
        if (success) {
          showSuccess("Base de données restaurée avec succès. L'application va redémarrer.");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showError("Échec de l'importation. Format de fichier invalide.");
        }
      };
      reader.readAsText(file);
    }
  };

  const allRoles = Object.keys(ROLE_PERMISSIONS) as AppRole[];
  const allPermissions = Object.keys(PERMISSION_LABELS) as Permission[];

  return (
    <PageTransition>
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-primary dark:text-white font-display tracking-tight leading-none">Paramètres</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Gestion globale & Sécurité du Sanctuaire</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full">
          {[
            { id: 'church', label: 'Identité Église', icon: <UsersIcon className="w-3 h-3 mr-2" /> },
            { id: 'security', label: 'Sécurité & Rôles', icon: <ShieldIcon className="w-3 h-3 mr-2" /> },
            { id: 'system', label: 'Système & IA', icon: <SparklesIcon className="w-3 h-3 mr-2" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex items-center ${activeTab === tab.id ? 'bg-card dark:bg-card-dark text-primary shadow-sm dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {activeTab === 'church' && (
            <Card className="border-none shadow-premium dark:shadow-none rounded-[2.5rem] p-8" title="Identité de l'Église">
              {/* Branding Mock */}
              <div className="mb-8 flex flex-col md:flex-row items-center gap-8 bg-slate-50 dark:bg-white/[0.02]/50 p-6 rounded-[2rem] border border-slate-100 dark:border-dark">
                <div className="w-24 h-24 rounded-full bg-white border-[3px] border-slate-200 dark:border-dark shadow-lg dark:shadow-none flex items-center justify-center relative group cursor-pointer transition-all duration-300">
                  <img src="/logo.png" alt="NCD Logo" className="w-14 h-14 object-contain" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest text-center">Modifier<br />Logo</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-bold text-slate-800 dark:text-white">Identité Visuelle</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Ce logo apparaîtra sur tous les rapports officiels et l'interface.</p>
                  <Button size="sm" variant="secondary" className="text-[10px] rounded-xl">Téléverser une image</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <Input label="Désignation Officielle" value={churchInfo.name} onChange={e => setChurchInfo({ ...churchInfo, name: e.target.value })} className="rounded-2xl" />
                <Input label="Pasteur Titulaire" value={churchInfo.pastor} onChange={e => setChurchInfo({ ...churchInfo, pastor: e.target.value })} className="rounded-2xl" />
                <Input label="Ville de Siège" value={churchInfo.city} onChange={e => setChurchInfo({ ...churchInfo, city: e.target.value })} className="rounded-2xl" />
                <Input label="E-mail de Contact" value={churchInfo.email} onChange={e => setChurchInfo({ ...churchInfo, email: e.target.value })} className="rounded-2xl" />
                <div className="md:col-span-2">
                  <Input label="Horaires des Cultes (Texte libre)" value={churchInfo.serviceTimes} onChange={e => setChurchInfo({ ...churchInfo, serviceTimes: e.target.value })} className="rounded-2xl" />
                </div>
                <div className="md:col-span-2 mt-2 flex justify-end">
                  <Button
                    onClick={() => {
                      localStorage.setItem('ncd_church_info', JSON.stringify(churchInfo));
                      showSuccess('Paramètres sauvegardés avec succès');
                    }}
                    className="rounded-xl px-8"
                  >
                    Enregistrer les Modifications
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-none shadow-premium dark:shadow-none rounded-[2.5rem] p-8" noPadding title="Matrice des Rôles & Permissions">
              <div className="overflow-x-auto custom-scrollbar pb-4">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.02]/50">
                      <th className="px-6 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-100 dark:border-dark sticky left-0 bg-slate-50 dark:bg-white/[0.02] z-20">Permission</th>
                      {allRoles.map(role => (
                        <th key={role} className="px-4 py-5 text-center text-[9px] font-black text-primary dark:text-white uppercase tracking-tight whitespace-nowrap min-w-[100px]">
                          {ROLE_LABELS[role]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allPermissions.map(perm => (
                      <tr key={perm} className="hover:bg-slate-50 dark:bg-white/[0.02]/50 transition-colors group">
                        <td className="px-6 py-4 text-[11px] font-bold text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-dark bg-card dark:bg-card-dark group-hover:bg-slate-50/50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          {PERMISSION_LABELS[perm]}
                        </td>
                        {allRoles.map(role => {
                          const hasPerm = ROLE_PERMISSIONS[role].includes(perm);
                          return (
                            <td key={`${role}-${perm}`} className="px-4 py-4 text-center">
                              <div className="flex justify-center">
                                {hasPerm ? (
                                  <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm dark:shadow-none border border-emerald-200">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Super Admin Bootstrap - Only visible to admin@ncd.com */}
              {isCurrentUserSuperAdminEmail() && (
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-t border-indigo-100 flex items-start gap-4">
                  <ShieldIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-300 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-indigo-800 dark:text-indigo-100 font-bold mb-1">Bootstrap Super Admin</p>
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-200/70 leading-relaxed mb-3">
                      Cliquez ici pour garantir que votre compte possède les privilèges SUPER_ADMIN dans la base de données. Utilisez cette fonction après votre première connexion ou en cas de problème d'accès.
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        try {
                          const updated = await ensureSuperAdminExists();
                          if (updated) {
                            alert('✅ Rôle SUPER_ADMIN configuré avec succès! Rechargement...');
                            window.location.reload();
                          } else {
                            alert('✅ Votre rôle SUPER_ADMIN est déjà correct.');
                          }
                        } catch (error: any) {
                          alert(`❌ Erreur: ${error.message}`);
                        }
                      }}
                      className="text-[10px] rounded-xl bg-indigo-600 hover:bg-indigo-700"
                    >
                      Activer SUPER_ADMIN
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-b-[2.5rem] border-t border-amber-100 flex items-start gap-4">
                <ShieldIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-800 font-bold mb-1">Architecture de Sécurité Verrouillée</p>
                  <p className="text-[10px] text-amber-700/70 leading-relaxed">
                    La modification des matrices de rôles est restreinte aux administrateurs cloud pour garantir l'intégrité des données financières. Contactez le support pour une demande de dérogation.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8">
              {/* Language Selection */}
              <Card className="border-none shadow-premium dark:shadow-none rounded-[2.5rem] p-8" title="Langue de l'Interface">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">Choisissez la langue d'affichage globale pour l'administration.</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { code: 'fr', label: 'Français' },
                    { code: 'en', label: 'English' },
                    { code: 'ln', label: 'Lingala' }
                  ].map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all border ${i18n.language === lang.code ? 'bg-primary text-white border-primary shadow-md dark:shadow-none' : 'bg-card dark:bg-card-dark text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark hover:border-primary/30 hover:bg-slate-50'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* AI Configuration */}
              <Card className="border-none shadow-premium dark:shadow-none rounded-[2.5rem] p-8" title="Configuration Assistant IA">
                <div className="flex items-start gap-6 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-[2rem] border border-indigo-100 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-card dark:bg-card-dark shadow-lg dark:shadow-none flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                    <SparklesIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900 dark:text-white">Personnalité du Modèle</h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-200/70 mt-1">
                      Ajustez le ton et le comportement de votre assistant virtuel pour qu'il corresponde à la culture de votre église.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tonalité des Réponses</label>
                    <div className="space-y-3">
                      {['Pastoral', 'Formel', 'Analytique'].map(tone => (
                        <label key={tone} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-dark cursor-pointer hover:bg-slate-50 dark:bg-white/[0.02] transition-colors">
                          <input
                            type="radio"
                            name="tone"
                            className="text-primary dark:text-white focus:ring-primary"
                            checked={aiConfig.tone === tone}
                            onChange={() => setAiConfig({ ...aiConfig, tone })}
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-white">{tone}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Style de Langage</label>
                    <select
                      value={aiConfig.formality}
                      onChange={(e) => setAiConfig({ ...aiConfig, formality: e.target.value })}
                      className="w-full p-4 rounded-xl border border-slate-200 dark:border-dark bg-card dark:bg-card-dark text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-primary/30"
                    >
                      <option>Soutenu</option>
                      <option>Courant</option>
                      <option>Simple (Accessibilité)</option>
                    </select>

                    <div className="mt-6">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Clé API (Google Gemini)</label>
                      <div className="relative">
                        <input
                          type="password"
                          placeholder="Collez votre clé API ici (commence par AIza...)"
                          value={localStorage.getItem('ncd_ai_key') || ''}
                          onChange={(e) => {
                            localStorage.setItem('ncd_ai_key', e.target.value);
                            // Force re-render to show value
                            const newKey = e.target.value;
                            setAiConfig(prev => ({ ...prev }));
                          }}
                          className="w-full p-4 rounded-xl border border-slate-200 dark:border-dark bg-card dark:bg-card-dark text-xs font-mono text-slate-600 dark:text-slate-400 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium mt-2">
                        Nécessaire pour activer les fonctionnalités d'IA. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary dark:text-white hover:underline">Obtenir une clé</a>
                      </p>
                    </div>

                    <div className="mt-6">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Prompt Système Global</label>
                      <textarea
                        value={aiConfig.systemPrompt}
                        onChange={(e) => setAiConfig({ ...aiConfig, systemPrompt: e.target.value })}
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-dark bg-card dark:bg-card-dark text-xs text-slate-600 dark:text-slate-400 leading-relaxed outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-justify"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-premium dark:shadow-none rounded-[2.5rem] p-8" title="Maintenance des Données">
                <div className="space-y-4 mt-2">
                  {/* Existing maintenance items kept concise */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 dark:bg-white/[0.02] rounded-[2rem] border border-slate-100 dark:border-dark gap-4">
                    <div>
                      <p className="text-xs font-black text-primary dark:text-white uppercase tracking-widest">Sauvegarde .JSON</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">Export complet.</p>
                    </div>
                    <Button onClick={handleExport} variant="secondary" size="sm" className="rounded-xl px-6 text-[10px]">Exporter</Button>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 dark:bg-white/[0.02] rounded-[2rem] border border-slate-100 dark:border-dark gap-4">
                    <div>
                      <p className="text-xs font-black text-primary dark:text-white uppercase tracking-widest">Restauration</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">Import de sauvegarde.</p>
                    </div>
                    <div className="relative">
                      <input type="file" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" />
                      <Button variant="white" size="sm" className="rounded-xl px-6 text-[10px]">Importer</Button>
                    </div>
                  </div>

                  {/* Load Real Church Data Button */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-blue-50 rounded-[2rem] border border-blue-200 gap-4">
                    <div>
                      <p className="text-xs font-black text-blue-700 uppercase tracking-widest">📋 Données Réelles NCD</p>
                      <p className="text-[10px] text-blue-600 font-bold mt-1">57 membres + 29 départements réels</p>
                    </div>
                    <Button
                      onClick={async () => {
                        const accepted = await confirm({
                          title: 'Charger les données réelles ?',
                          message: 'Les données de test seront remplacées par les 57 membres et 29 départements réels de NCD.',
                          confirmLabel: 'Charger',
                          variant: 'warning',
                        });
                        if (accepted) {
                          const result = await loadRealChurchData();
                          if (result.success) {
                            alert('✅ Données réelles chargées! Rechargez la page.');
                            window.location.reload();
                          } else {
                            alert('❌ Erreur');
                          }
                        }
                      }}
                      variant="secondary"
                      size="sm"
                      className="rounded-xl px-6 text-[10px] bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Charger Données Réelles
                    </Button>
                  </div>


                  {/* Update Programme Button */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-purple-50 rounded-[2rem] border border-purple-200 gap-4">
                    <div>
                      <p className="text-xs font-black text-purple-700 uppercase tracking-widest">📅 Programme des Cultes</p>
                      <p className="text-[10px] text-purple-600 font-bold mt-1">Générer 6 mois de services récurrents</p>
                    </div>
                    <Button
                      onClick={async () => {
                        console.log('🔘 Programme Update button clicked');
                        console.log('👤 Current user:', currentUser);

                        if (!currentUser) {
                          alert('❌ Vous devez être connecté pour mettre à jour le programme.');
                          return;
                        }

                        // Execute directly without confirmation
                        try {
                          console.log('⏳ Starting programme update...');
                          const { updateProgramme } = await import('../utils/updateProgramme');
                          console.log('✅ Module imported successfully');

                          const success = await updateProgramme();
                          console.log('📊 Update result:', success);

                          if (success) {
                            alert('✅ Programme mis à jour avec succès! La page va se recharger.');
                            window.location.reload();
                          } else {
                            alert('❌ Erreur lors de la mise à jour du programme. Vérifiez la console pour plus de détails.');
                          }
                        } catch (error: any) {
                          console.error('💥 Error updating programme:', error);
                          alert(`❌ Erreur: ${error.message}\n\nVérifiez la console (F12) pour plus de détails.`);
                        }
                      }}
                      variant="secondary"
                      size="sm"
                      className="rounded-xl px-6 text-[10px] bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Mettre à Jour Programme
                    </Button>
                  </div>

                  {/* Import Departments Button */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-green-50 rounded-[2rem] border border-green-200 gap-4">
                    <div>
                      <p className="text-xs font-black text-green-700 uppercase tracking-widest">🏛️ Départements & Leaders</p>
                      <p className="text-[10px] text-green-600 font-bold mt-1">Importer 29 départements avec leaders officiels</p>
                    </div>
                    <Button
                      onClick={async () => {
                        console.log('🔘 Import Departments button clicked');

                        if (!currentUser) {
                          alert('❌ Vous devez être connecté pour importer les départements.');
                          return;
                        }

                        // Execute directly without confirmation
                        try {
                          console.log('⏳ Starting departments import...');
                          const { importDepartmentsAndLeaders } = await import('../utils/importDepartments');
                          const { db } = await import('../firebase');
                          console.log('✅ Module imported successfully');

                          const result = await importDepartmentsAndLeaders(db);
                          console.log('📊 Import result:', result);

                          if (result) {
                            alert(`✅ ${result} départements importés avec succès! La page va se recharger.`);
                            window.location.reload();
                          } else {
                            alert('❌ Erreur lors de l\'importation. Vérifiez la console pour plus de détails.');
                          }
                        } catch (error: any) {
                          console.error('💥 Error importing departments:', error);
                          alert(`❌ Erreur: ${error.message}\n\nVérifiez la console (F12) pour plus de détails.`);
                        }
                      }}
                      variant="secondary"
                      size="sm"
                      className="rounded-xl px-6 text-[10px] bg-green-600 text-white hover:bg-green-700"
                    >
                      Importer Départements
                    </Button>
                  </div>

                  {/* Clean Duplicate Departments Button */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-yellow-50 rounded-[2rem] border border-yellow-200 gap-4">
                    <div>
                      <p className="text-xs font-black text-yellow-700 uppercase tracking-widest">🧹 Nettoyer Doublons</p>
                      <p className="text-[10px] text-yellow-600 font-bold mt-1">Supprimer les départements en double</p>
                    </div>
                    <Button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        const accepted = await confirm({
                          title: 'Nettoyer les doublons ?',
                          message: 'Seule la version la plus récente de chaque département sera conservée.',
                          confirmLabel: 'Nettoyer',
                          variant: 'warning',
                        });
                        if (!accepted) return;

                        try {
                          const { removeDuplicateDepartments } = await import('../utils/cleanDuplicateDepartments');
                          const result = await removeDuplicateDepartments();

                          if (result.success) {
                            if (result.deleted === 0) {
                              alert('✨ Aucun doublon trouvé!');
                            } else {
                              alert(`✅ ${result.deleted} doublons supprimés!`);
                              window.location.reload();
                            }
                          } else {
                            alert('❌ Erreur lors du nettoyage.');
                          }
                        } catch (error: any) {
                          console.error('Error:', error);
                          alert(`❌ Erreur: ${error.message}`);
                        }
                      }}
                      variant="secondary"
                      size="sm"
                      className="rounded-xl px-6 text-[10px] bg-yellow-600 text-white hover:bg-yellow-700"
                    >
                      Nettoyer Départements
                    </Button>

                    <Button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        const accepted = await confirm({
                          title: 'Nettoyer les membres en double ?',
                          message: 'La version la plus complète de chaque membre sera conservée.',
                          confirmLabel: 'Nettoyer',
                          variant: 'warning',
                        });
                        if (!accepted) return;

                        try {
                          const { removeDuplicateMembers } = await import('../utils/cleanDuplicateMembers');
                          const result = await removeDuplicateMembers();

                          if (result.success) {
                            if (result.deleted === 0) {
                              alert('✨ Aucun membre en double trouvé!');
                            } else {
                              alert(`✅ ${result.deleted} membres en double supprimés!`);
                              window.location.reload();
                            }
                          } else {
                            alert('❌ Erreur lors du nettoyage.');
                          }
                        } catch (error: any) {
                          console.error('Error:', error);
                          alert(`❌ Erreur: ${error.message}`);
                        }
                      }}
                      variant="secondary"
                      size="sm"
                      className="rounded-xl px-6 text-[10px] bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Nettoyer Membres
                    </Button>
                  </div>

                  {/* Clean Old Members Button */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-red-50 dark:bg-red-900/20 rounded-[2rem] border border-red-200 gap-4 mt-2">
                    <div>
                      <p className="text-xs font-black text-red-700 uppercase tracking-widest">🗑️ Anciens Membres</p>
                      <p className="text-[10px] text-red-600 font-bold mt-1">Supprimer tous les membres de l'archive via ({(import.meta as any).env.VITE_FIREBASE_PROJECT_ID})</p>
                    </div>
                    <Button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        const accepted = await confirm({
                          title: 'Supprimer les anciens membres ?',
                          message: 'ATTENTION: TOUS les membres listés dans le fichier archive seront supprimés. Cette action est irréversible.',
                          confirmLabel: 'Supprimer tout',
                          variant: 'danger',
                        });
                        if (!accepted) return;

                        try {
                          const { cleanOldMembers } = await import('../utils/cleanOldMembers');
                          const count = await cleanOldMembers();
                          alert(`Succès ! ${count} anciens membres supprimés.`);
                          window.location.reload();
                        } catch (error: any) {
                          console.error('Error cleaning old members:', error);
                          alert('Erreur lors du nettoyage: ' + error.message);
                        }
                      }}
                      variant="secondary"
                      size="sm"
                      className="rounded-xl px-6 text-[10px] bg-red-600 text-white hover:bg-red-700"
                    >
                      Supprimer Tout
                    </Button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-red-50 dark:bg-red-900/20/30 rounded-[2rem] border border-red-100 gap-4">
                    <div>
                      <p className="text-xs font-black text-red-600 uppercase tracking-widest">Zone Danger</p>
                      <p className="text-[10px] text-red-400 font-bold mt-1">Réinitialisation usine.</p>
                    </div>
                    <Button onClick={async () => { const accepted = await confirm({ title: 'Réinitialisation totale ?', message: 'CETTE ACTION EST IRRÉVERSIBLE. Toutes les données seront effacées définitivement.', confirmLabel: 'Tout effacer', variant: 'danger' }); if (accepted) resetDatabase(); }} variant="danger" size="sm" className="rounded-xl px-6 text-[10px] bg-red-500">Reset</Button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-orange-50/30 rounded-[2rem] border border-orange-100 gap-4 mt-2">
                    <div>
                      <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Nettoyage Finances</p>
                      <p className="text-[10px] text-orange-400 font-bold mt-1">Supprime toutes les transactions.</p>
                    </div>
                    <Button
                      onClick={async () => {
                        const accepted = await confirm({
                          title: 'Purger les finances ?',
                          message: 'TOUTES les données financières seront supprimées définitivement.',
                          confirmLabel: 'Purger',
                          variant: 'danger',
                        });
                        if (accepted) {
                          const { clearFinances } = await import('../utils/cleanFinances');
                          const result = await clearFinances();
                          if (result.success) {
                            alert('✅ Finances nettoyées avec succès !');
                            window.location.reload();
                          } else {
                            alert('❌ Erreur lors du nettoyage.');
                          }
                        }
                      }}
                      variant="danger"
                      size="sm"
                      className="rounded-xl px-6 text-[10px] bg-orange-500"
                    >
                      Purger Finances
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <Card className="border-none bg-primary text-white shadow-premium dark:shadow-none rounded-[2.5rem] p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-[2rem] mx-auto border-4 border-white/10 mb-4 shadow-2xl dark:shadow-none overflow-hidden relative">
                <img src={currentUser?.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
              </div>
              <h3 className="font-black text-xl font-display">{currentUser?.name}</h3>
              <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-1">{currentUser?.role}</p>
            </div>
            <div className="space-y-3">
              <Button variant="danger" className="w-full rounded-2xl py-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white" onClick={logout}>Déconnexion</Button>
            </div>
          </Card>

          <Card className="border-none shadow-premium dark:shadow-none rounded-[2.5rem] p-8" title="Santé Backend">
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latence</span>
                <span className="text-sm font-bold text-primary dark:text-white">{health?.latency || '--'}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync</span>
                <span className="text-sm font-bold text-green-500">{isLoading ? 'En cours...' : 'Terminé'}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-dark">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                    <SparklesIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gemini 3 Pro Connecté</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog {...confirmState} onCancel={cancelConfirm} />
    </PageTransition>
  );
};

export default SettingsPage;
