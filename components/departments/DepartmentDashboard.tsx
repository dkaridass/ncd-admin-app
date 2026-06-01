
import React, { useState, useRef, useEffect } from 'react';
import { Department, DepartmentReport } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { FileTextIcon } from '../icons/Icons';
import { useData } from '../../context/DataContext';
import Input from '../ui/Input';
import { useSupabaseUpload } from '../../hooks/useSupabaseUpload';

interface DepartmentDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    department: Department | null;
}

const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({ isOpen, onClose, department }) => {
    const { departmentReports, addDepartmentReport, updateReportStatus, deleteDepartmentReport, hasPermission, members, updateDepartment, deleteDepartment, isLoading, currentUser } = useData();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'reports' | 'settings'>('overview');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const { confirmState, confirm, cancelConfirm } = useConfirm();
    const { uploadFile, isUploading: isUploadingFile } = useSupabaseUpload();

    // Edit State
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editMeetingDay, setEditMeetingDay] = useState('');
    const [editMeetingDays, setEditMeetingDays] = useState<string[]>([]);
    const [editMeetingTime, setEditMeetingTime] = useState('');
    const [editLeaderId, setEditLeaderId] = useState('');
    const [editVpId, setEditVpId] = useState('');
    const [editSecondVpId, setEditSecondVpId] = useState('');

    // Reports (URL-only mode)
    const reportsMode = (import.meta.env.VITE_REPORT_FILES_MODE as 'link' | 'firebase' | undefined) || 'link';
    const [reportUrl, setReportUrl] = useState('');
    const [reportFileName, setReportFileName] = useState('');
    const [reportNote, setReportNote] = useState('');

    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    useEffect(() => {
        if (department) {
            setEditName(department.name || '');
            setEditDescription(department.description || '');
            setEditMeetingDay(department.meetingDay || '');
            setEditMeetingDays(department.meetingDays || []);
            setEditMeetingTime(department.meetingTime || '');
            setEditLeaderId(department.leaderId || '');
            setEditVpId(department.vpId || '');
            setEditSecondVpId(department.secondVpId || '');
            setSettingsError(null);

            // Reset report draft when switching departments
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setReportUrl('');
            setReportFileName('');
            setReportNote('');
        }
    }, [department]);

    if (!department) return null;

    // Filter members for this department - dynamically calculate member count
    const deptMembers = members.filter(m =>
        m.departmentIds?.includes(department.id) ||
        m.primaryDepartmentId === department.id
    );

    // Calculate actual member count (should match what's stored, but we'll use real-time calculation)
    const actualMemberCount = deptMembers.length;

    // Find leaders (Fallback to role 'Berger'/'Pasteur' if leaderId not explicit)
    const leader = department.leaderId
        ? members.find(m => m.id === department.leaderId)
        : deptMembers.find(m => m.role === 'Berger' || m.role === 'Pasteur' || m.role === 'Pasteure');

    const vp = department.vpId ? members.find(m => m.id === department.vpId) : null;
    const secondVp = department.secondVpId ? members.find(m => m.id === department.secondVpId) : null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDayToggle = (day: string) => {
        setEditMeetingDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleSubmitReport = async () => {
        if (!department) return;

        // URL-only mode: immediate value without Firebase Storage bucket
        if (reportsMode === 'link') {
            const url = reportUrl.trim();
            if (!url) return;
            if (!/^https?:\/\//i.test(url)) {
                alert('Veuillez coller un lien valide (commençant par http:// ou https://).');
                return;
            }

            setIsSubmittingReport(true);
            try {
                const year = new Date().getFullYear();
                const newReport: Omit<DepartmentReport, 'id'> = {
                    departmentId: department.id,
                    month: new Date().toLocaleString('fr-FR', { month: 'long' }),
                    year,
                    submittedAt: new Date().toISOString().split('T')[0],
                    content: reportNote?.trim()
                        ? reportNote.trim()
                        : `Rapport mensuel : ${reportFileName?.trim() || 'Lien partagé'}`,
                    fileName: reportFileName?.trim() || undefined,
                    fileUrl: url,
                    submittedByUserId: currentUser?.id,
                    submittedByName: currentUser?.name,
                    status: 'En attente'
                };

                await addDepartmentReport(newReport as DepartmentReport);
                setReportUrl('');
                setReportFileName('');
                setReportNote('');
                setActiveTab('reports');
                alert("✅ Rapport soumis avec succès !");
            } catch (error: any) {
                console.error('Error submitting report (link mode):', error);
                alert('Erreur lors de la soumission du rapport: ' + (error.message || 'Erreur inconnue'));
            } finally {
                setIsSubmittingReport(false);
            }
            return;
        }

        // Supabase Storage mode
        if (!selectedFile) return;

        setIsSubmittingReport(true);
        try {
            const year = new Date().getFullYear();

            // Upload to Supabase via our hook
            const { url, fileName } = await uploadFile(selectedFile, 'reports', ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'], 10);

            const newReport: Omit<DepartmentReport, 'id'> = {
                departmentId: department.id,
                month: new Date().toLocaleString('fr-FR', { month: 'long' }),
                year,
                submittedAt: new Date().toISOString().split('T')[0],
                content: reportNote?.trim() ? reportNote.trim() : `Rapport mensuel : ${fileName}`,
                fileName: fileName,
                fileUrl: url,
                submittedByUserId: currentUser?.id,
                submittedByName: currentUser?.name,
                status: 'En attente'
            };

            await addDepartmentReport(newReport as DepartmentReport);
            setSelectedFile(null);
            setReportNote('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            setActiveTab('reports');
            alert("✅ Rapport soumis avec succès !");
        } catch (error: any) {
            console.error('Error submitting report:', error);
            alert('Erreur lors de la soumission du rapport: ' + (error.message || 'Erreur inconnue'));
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const handleApprove = async (reportId: string) => {
        try {
            await updateReportStatus(reportId, 'Approuvé');
        } catch (error: any) {
            console.error('Error approving report:', error);
            alert('Erreur lors de l\'approbation: ' + (error.message || 'Erreur inconnue'));
        }
    };

    const handleDeleteReport = async (reportId: string, reportLabel: string) => {
        const accepted = await confirm({
            title: 'Supprimer ce rapport ?',
            message: `Le rapport "${reportLabel}" sera supprimé définitivement. Cette action est irréversible.`,
            confirmLabel: 'Supprimer',
            variant: 'danger',
        });
        if (!accepted) return;
        try {
            await deleteDepartmentReport(reportId);
        } catch (error: any) {
            console.error('Error deleting report:', error);
            alert('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
        }
    };

    // Returns true if report is older than 30 days
    const isExpired = (submittedAt: string) => {
        const age = (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24);
        return age > 30;
    };

    const handleSaveSettings = async () => {
        if (!editName.trim()) {
            setSettingsError('Le nom du département est requis');
            return;
        }

        setIsSavingSettings(true);
        setSettingsError(null);
        try {
            const updates: Partial<Department> = {
                name: editName.trim(),
                ...(editDescription.trim() && { description: editDescription.trim() }),
                ...(editMeetingDays.length > 0 && { meetingDays: editMeetingDays }),
                ...(editMeetingDay.trim() && !editMeetingDays.length && { meetingDay: editMeetingDay.trim() }),
                ...(editMeetingTime.trim() && { meetingTime: editMeetingTime.trim() }),
                ...(editLeaderId && { leaderId: editLeaderId }),
                ...(editVpId && { vpId: editVpId }),
                ...(editSecondVpId && { secondVpId: editSecondVpId }),
                memberCount: actualMemberCount // Update member count dynamically
            };

            await updateDepartment(department.id, updates);
            alert("✅ Modifications enregistrées !");
        } catch (error: any) {
            console.error('Error saving settings:', error);
            setSettingsError(error.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleDeleteDepartment = async () => {
        // Safety checks
        const deptReports = departmentReports.filter(r => r.departmentId === department.id);
        const hasMembers = deptMembers.length > 0;
        const hasReports = deptReports.length > 0;

        let warningMessage = '⚠️ La suppression est irréversible.';
        if (hasMembers) {
            warningMessage += `\n\n• ${deptMembers.length} membre(s) assigné(s) à ce département`;
        }
        if (hasReports) {
            warningMessage += `\n• ${deptReports.length} rapport(s) associé(s) à ce département`;
        }

        const accepted = await confirm({
            title: 'Supprimer ce département ?',
            message: warningMessage,
            confirmLabel: 'Supprimer définitivement',
            variant: 'danger',
        });
        if (!accepted) return;

        setIsDeleting(true);
        try {
            await deleteDepartment(department.id);
            onClose();
        } catch (error: any) {
            console.error('Error deleting department:', error);
            alert('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Hub: ${department.name}`}>
                <div className="flex flex-col h-[80vh]">
                    {/* Tabs */}
                    <div className="flex gap-2 px-1 mb-6 border-b border-slate-100 dark:border-dark">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary dark:border-white/20 text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                        >
                            Vue d'ensemble
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'members' ? 'border-primary dark:border-white/20 text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                        >
                            Membres <span className="ml-2 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">{deptMembers.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'reports' ? 'border-primary dark:border-white/20 text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                        >
                            Rapports
                        </button>
                        {hasPermission('MANAGE_DEPARTMENTS') && (
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'settings' ? 'border-primary dark:border-white/20 text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                            >
                                Paramètres
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-4 space-y-8">

                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-lg border border-slate-100 dark:border-dark text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Effectif</p>
                                        <p className="text-xl font-black text-primary dark:text-white">{actualMemberCount}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-lg border border-slate-100 dark:border-dark text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Réunion</p>
                                        <p className="text-xl font-black text-primary dark:text-white">
                                            {department.meetingDays && department.meetingDays.length > 0
                                                ? `${department.meetingDays.length}j/sem`
                                                : (department.meetingDay ? department.meetingDay.substring(0, 3) : '-')}
                                        </p>
                                        {department.meetingTime && (
                                            <p className="text-[8px] text-slate-400 mt-1">{department.meetingTime}</p>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-lg border border-slate-100 dark:border-dark text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                        <p className={`text-xl font-black ${department.reportStatus === 'À jour' ? 'text-emerald-500' : 'text-rose-500'}`}>{department.reportStatus === 'À jour' ? 'OK' : '!'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-lg border border-slate-100 dark:border-dark text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Archivés</p>
                                        <p className="text-xl font-black text-primary dark:text-white">{departmentReports.filter(r => r.departmentId === department.id).length}</p>
                                    </div>
                                </div>

                                {/* Leadership Section */}
                                <div className="bg-card dark:bg-card-dark p-6 rounded-lg border border-indigo-50 shadow-sm dark:shadow-none relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -z-0 opacity-50" />
                                    <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-6 relative z-10">Leadership</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                        {/* New Schema Display */}
                                        {department.leaders && department.leaders.length > 0 ? (
                                            department.leaders.map((leader, index) => (
                                                <div key={index} className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm dark:shadow-none ${leader.role === 'Titulaire' || leader.role === 'Pasteur' ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-50 dark:bg-white/[0.02] text-slate-400'}`}>
                                                        <span className="font-black text-xs">{leader.role.substring(0, 2).toUpperCase()}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{leader.role}</p>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{leader.name}</p>
                                                        {leader.title && <p className="text-[9px] text-slate-400 italic">{leader.title}</p>}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            /* Legacy Fallback */
                                            <>
                                                {/* Titulaire */}
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-sm dark:shadow-none">
                                                        {leader?.avatarUrl ? <img src={leader.avatarUrl} className="w-full h-full rounded-full" /> : <span className="font-black text-indigo-500">L</span>}
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Titulaire</p>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{leader?.name || department.leaderName || 'Non assigné'}</p>
                                                    </div>
                                                </div>

                                                {/* VP */}
                                                {(vp || department.vpName) && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center border-4 border-white shadow-sm dark:shadow-none">
                                                            {vp?.avatarUrl ? <img src={vp.avatarUrl} className="w-full h-full rounded-full" /> : <span className="font-black text-slate-400">VP</span>}
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Adjoint</p>
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{vp?.name || department.vpName}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 2ème VP */}
                                                {(secondVp || department.secondVpName) && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center border-4 border-white shadow-sm dark:shadow-none">
                                                            <span className="font-black text-slate-400">2VP</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">2ème Adjoint</p>
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{secondVp?.name || department.secondVpName}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div className="space-y-4 animate-fade-in">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2 mb-4">Membres du Département</h4>
                                {isLoading && deptMembers.length === 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                ) : deptMembers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {deptMembers.map(member => (
                                            <div key={member.id} className="flex items-center gap-4 p-4 bg-card dark:bg-card-dark border border-slate-100 dark:border-dark rounded-lg hover:shadow-sm dark:shadow-none hover:border-primary/20 transition-all">
                                                <img
                                                    src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.name}`}
                                                    className="w-10 h-10 rounded-full object-cover bg-slate-100"
                                                    alt={member.name}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{member.name}</p>
                                                    <div className="flex gap-2 flex-wrap">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{member.role}</span>
                                                        {member.isLeader && <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-2 rounded-full">Leader</span>}
                                                        {member.churchFunction && <span className="text-[9px] font-bold text-primary dark:text-white uppercase bg-primary/10 px-2 rounded-full">{member.churchFunction}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 opacity-40">
                                        <p className="text-xs font-bold uppercase tracking-widest mb-2">Aucun membre assigné</p>
                                        <p className="text-[10px] text-slate-400">Les membres peuvent être assignés depuis leur profil</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-primary/5 p-8 rounded-lg border-2 border-dashed border-primary dark:border-white/20/20 text-center relative overflow-hidden">
                                    <h4 className="text-[10px] font-black uppercase text-primary dark:text-white tracking-[0.3em] mb-6">Soumettre Nouveau Rapport</h4>
                                    {reportsMode === 'link' ? (
                                        <div className="max-w-xl mx-auto text-left space-y-4">
                                            <div className="bg-card dark:bg-card-dark rounded-lg border border-slate-200 dark:border-dark p-6">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-slate-50 dark:bg-white/[0.02] rounded-lg flex items-center justify-center">
                                                        <FileTextIcon className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            Mode Lien (Drive/Dropbox)
                                                        </p>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-white">
                                                            Collez un lien de partage du rapport.
                                                        </p>
                                                    </div>
                                                </div>

                                                <Input
                                                    label="Lien du fichier (obligatoire)"
                                                    value={reportUrl}
                                                    onChange={(e) => setReportUrl(e.target.value)}
                                                    placeholder="https://drive.google.com/..."
                                                />
                                                <div className="mt-3">
                                                    <Input
                                                        label="Nom du fichier (optionnel)"
                                                        value={reportFileName}
                                                        onChange={(e) => setReportFileName(e.target.value)}
                                                        placeholder="Rapport Février 2026"
                                                    />
                                                </div>
                                                <div className="mt-3">
                                                    <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                                                        Note (optionnel)
                                                    </label>
                                                    <textarea
                                                        value={reportNote}
                                                        onChange={(e) => setReportNote(e.target.value)}
                                                        rows={3}
                                                        className="block w-full px-4 py-3 border border-slate-200 dark:border-dark rounded-lg bg-card dark:bg-card-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs md:text-sm transition-all shadow-sm dark:shadow-none"
                                                        placeholder="Résumé ou message pour la supervision..."
                                                    />
                                                </div>

                                                <div className="flex justify-end gap-2 mt-5">
                                                    <Button
                                                        onClick={() => {
                                                            setReportUrl('');
                                                            setReportFileName('');
                                                            setReportNote('');
                                                        }}
                                                        variant="white"
                                                        className="rounded-lg py-2 px-6 text-[10px]"
                                                        disabled={isSubmittingReport}
                                                    >
                                                        Réinitialiser
                                                    </Button>
                                                    <Button
                                                        onClick={handleSubmitReport}
                                                        disabled={isSubmittingReport || !reportUrl.trim()}
                                                        isLoading={isSubmittingReport}
                                                        className="rounded-lg py-2 px-6 bg-primary text-white uppercase font-black text-[10px] disabled:opacity-50"
                                                    >
                                                        Envoyer
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            />
                                            {!selectedFile ? (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="cursor-pointer py-8 px-6 bg-card dark:bg-card-dark rounded-lg border border-slate-200 dark:border-dark hover:border-secondary transition-all group shadow-sm dark:shadow-none"
                                                >
                                                    <div className="w-12 h-12 bg-slate-50 dark:bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-secondary/10 transition-colors">
                                                        <FileTextIcon className="w-6 h-6 text-slate-300 group-hover:text-secondary" />
                                                    </div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Choisir un fichier</p>
                                                </div>
                                            ) : (
                                                <div className="py-6 px-6 bg-secondary/10 rounded-lg border-2 border-secondary/30">
                                                    <p className="text-[11px] font-black text-primary dark:text-white mb-4">{selectedFile.name}</p>

                                                    <div className="mb-4 text-left">
                                                        <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                                                            Note (optionnel)
                                                        </label>
                                                        <textarea
                                                            value={reportNote}
                                                            onChange={(e) => setReportNote(e.target.value)}
                                                            rows={2}
                                                            className="block w-full px-4 py-3 border border-slate-200 dark:border-dark rounded-lg bg-card dark:bg-card-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs md:text-sm transition-all shadow-sm dark:shadow-none"
                                                            placeholder="Résumé rapide pour l'administrateur..."
                                                        />
                                                    </div>

                                                    <div className="flex gap-2 justify-center">
                                                        <button onClick={() => setSelectedFile(null)} disabled={isSubmittingReport || isUploadingFile} className="px-4 py-2 bg-card dark:bg-card-dark text-red-500 rounded-lg text-[10px] font-black uppercase disabled:opacity-50">Annuler</button>
                                                        <Button
                                                            onClick={handleSubmitReport}
                                                            disabled={isSubmittingReport || isUploadingFile}
                                                            isLoading={isSubmittingReport || isUploadingFile}
                                                            className="rounded-lg py-2 px-6 bg-primary text-white uppercase font-black text-[10px] disabled:opacity-50"
                                                        >
                                                            {isUploadingFile ? "Upload du Rapport..." : "Envoyer"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {departmentReports.filter(r => r.departmentId === department.id).length > 0 ? (
                                        departmentReports
                                            .filter(r => r.departmentId === department.id)
                                            .sort((a, b) => {
                                                if (a.year !== b.year) return b.year - a.year;
                                                const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
                                                return months.indexOf(b.month.toLowerCase()) - months.indexOf(a.month.toLowerCase());
                                            })
                                            .map(report => (
                                                <div key={report.id} className={`bg-card dark:bg-card-dark p-4 rounded-lg border hover:shadow-sm dark:shadow-none transition-all ${isExpired(report.submittedAt) ? 'border-red-200 dark:border-red-900/40' : 'border-slate-100 dark:border-dark'}`}>
                                                    {isExpired(report.submittedAt) && (
                                                        <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-2">⚠ Rapport expiré — suppression recommandée</p>
                                                    )}
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className="w-10 h-10 bg-slate-50 dark:bg-white/[0.02] rounded-lg flex items-center justify-center text-primary dark:text-white flex-shrink-0">
                                                                <FileTextIcon className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-black text-primary dark:text-white uppercase truncate">{report.month} {report.year}</p>
                                                                {report.fileName && (
                                                                    <p className="text-[9px] text-slate-400 truncate mt-1">{report.fileName}</p>
                                                                )}
                                                                {report.fileUrl && (
                                                                    <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex mt-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold hover:bg-blue-100 transition-colors">
                                                                        Télécharger la pièce jointe
                                                                    </a>
                                                                )}
                                                                <div className="mt-1">
                                                                    <Badge variant={report.status === 'Approuvé' ? 'success' : report.status === 'Révisé' ? 'warning' : 'outline'} className="text-[8px] px-2 py-0.5">{report.status}</Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                                            {hasPermission('MANAGE_DEPARTMENTS') && report.status === 'En attente' && (
                                                                <Button
                                                                    onClick={() => handleApprove(report.id)}
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    className="rounded-lg text-[8px] uppercase font-black px-3"
                                                                >
                                                                    Approuver
                                                                </Button>
                                                            )}
                                                            {hasPermission('MANAGE_DEPARTMENTS') && (
                                                                <button
                                                                    onClick={() => handleDeleteReport(report.id, `${report.month} ${report.year}`)}
                                                                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                    title="Supprimer ce rapport"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-center py-10 opacity-40">
                                            <FileTextIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Aucun rapport soumis</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Soumettez le premier rapport ci-dessus</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && hasPermission('MANAGE_DEPARTMENTS') && (
                            <div className="space-y-8 animate-fade-in p-2">
                                {settingsError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-bold">
                                        {settingsError}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                            Nom du Pôle <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold text-slate-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="Nom du département"
                                            disabled={isSavingSettings}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                        <textarea
                                            value={editDescription}
                                            onChange={e => setEditDescription(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold text-slate-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                            placeholder="Description du département..."
                                            disabled={isSavingSettings}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jours de Réunion</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                            {daysOfWeek.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleDayToggle(day)}
                                                    disabled={isSavingSettings}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${editMeetingDays.includes(day) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 dark:text-slate-400 hover:bg-slate-200'} disabled:opacity-50`}
                                                >
                                                    {day.substring(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                        {editMeetingDays.length === 0 && (
                                            <input
                                                type="text"
                                                value={editMeetingDay}
                                                onChange={e => setEditMeetingDay(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold text-slate-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                                placeholder="Ou saisir manuellement (ex: Samedi)"
                                                disabled={isSavingSettings}
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Heure de Réunion</label>
                                        <input
                                            type="text"
                                            value={editMeetingTime}
                                            onChange={e => setEditMeetingTime(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold text-slate-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="Ex: 17h00"
                                            disabled={isSavingSettings}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Titulaire (Leader Principal)</label>
                                        <select
                                            value={editLeaderId}
                                            onChange={e => setEditLeaderId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold text-slate-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                            disabled={isSavingSettings}
                                        >
                                            <option value="">-- Sélectionner Titulaire --</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vice-Président (VP)</label>
                                        <select
                                            value={editVpId}
                                            onChange={e => setEditVpId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold text-slate-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                            disabled={isSavingSettings}
                                        >
                                            <option value="">-- Sélectionner VP --</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">2ème Vice-Président (2VP)</label>
                                        <select
                                            value={editSecondVpId}
                                            onChange={e => setEditSecondVpId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold text-slate-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                            disabled={isSavingSettings}
                                        >
                                            <option value="">-- Sélectionner 2VP --</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={handleSaveSettings}
                                            disabled={isSavingSettings}
                                            className="bg-primary text-white rounded-lg px-8 py-3 uppercase font-black tracking-widest text-[10px] disabled:opacity-50"
                                        >
                                            {isSavingSettings ? 'Enregistrement...' : 'Enregistrer'}
                                        </Button>
                                    </div>

                                    <div className="border-t border-red-100 mt-8 pt-8">
                                        <h5 className="text-red-500 font-black text-xs uppercase tracking-widest mb-2">Zone Danger</h5>
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-bold">⚠️ La suppression est irréversible.</p>
                                            {deptMembers.length > 0 && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">• {deptMembers.length} membre(s) assigné(s)</p>
                                            )}
                                            {departmentReports.filter(r => r.departmentId === department.id).length > 0 && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">• {departmentReports.filter(r => r.departmentId === department.id).length} rapport(s) associé(s)</p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleDeleteDepartment}
                                            disabled={isDeleting}
                                            className="bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg px-6 py-3 uppercase font-black tracking-widest text-[10px] disabled:opacity-50"
                                        >
                                            {isDeleting ? 'Suppression...' : 'Supprimer le Département'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
            <ConfirmDialog {...confirmState} onCancel={cancelConfirm} />
        </>);
};

export default DepartmentDashboard;
