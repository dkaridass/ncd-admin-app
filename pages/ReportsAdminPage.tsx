import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DepartmentReport } from '../types';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import { FileTextIcon, CheckIcon, XIcon, FilterIcon, DownloadIcon, EyeIcon } from '../components/icons/Icons';
import { showSuccess, showError } from '../utils/toast';
import { useSupabaseUpload } from '../hooks/useSupabaseUpload';

const ReportsAdminPage: React.FC = () => {
    const { departmentReports, departments, updateReportStatus, updateDepartmentReport, deleteDepartmentReport, isLoading, hasPermission } = useData();
    const [filterStatus, setFilterStatus] = useState<'All' | 'En attente' | 'Approuvé' | 'Révisé'>('En attente');
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewReport, setViewReport] = useState<DepartmentReport | null>(null);
    const { confirmState, confirm, cancelConfirm } = useConfirm();
    const { deleteFile } = useSupabaseUpload();

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ content: '', month: '', year: 2024 });

    // Identify when checking a report to prep edit form
    React.useEffect(() => {
        if (viewReport) {
            setEditForm({
                content: viewReport.content,
                month: viewReport.month,
                year: viewReport.year
            });
            setIsEditing(false);
        }
    }, [viewReport]);

    const handleSaveEdit = async () => {
        if (!viewReport) return;
        setIsSubmitting(true);
        try {
            await updateDepartmentReport(viewReport.id, editForm);
            showSuccess("Rapport mis à jour avec succès");
            setIsEditing(false);
            // Update local view
            setViewReport(prev => prev ? { ...prev, ...editForm } : null);
        } catch (error) {
            showError("Erreur lors de la mise à jour");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter reports
    const filteredReports = useMemo(() => {
        return departmentReports.filter(report => {
            if (filterStatus !== 'All' && report.status !== filterStatus) return false;
            return true;
        });
    }, [departmentReports, filterStatus]);

    const getDepartmentName = (id: string) => {
        return departments.find(d => d.id === id)?.name || 'Département Inconnu';
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedReports(filteredReports.map(r => r.id));
        } else {
            setSelectedReports([]);
        }
    };

    const handleSelectReport = (id: string) => {
        setSelectedReports(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleBulkApprove = async () => {
        if (!hasPermission('MANAGE_DEPARTMENT_REPORTS')) {
            showError("Permissions insuffisantes pour approuver des rapports.");
            return;
        }
        if (selectedReports.length === 0) return;
        const accepted = await confirm({
            title: `Approuver ${selectedReports.length} rapports ?`,
            message: `Voulez-vous vraiment approuver ${selectedReports.length} rapports en une seule fois ?`,
            confirmLabel: 'Approuver tout',
            variant: 'info',
        });
        if (!accepted) return;

        setIsSubmitting(true);
        try {
            // Process sequentially to avoid overwhelming Firestore (though batch would be better)
            // For now, simple loop is fine given implementation constraints
            let successCount = 0;
            for (const id of selectedReports) {
                try {
                    await updateReportStatus(id, 'Approuvé');
                    successCount++;
                } catch (err) {
                    console.error(`Failed to approve ${id}`, err);
                }
            }
            showSuccess(`${successCount} rapports approuvés avec succès`);
            setSelectedReports([]);
        } catch (error) {
            showError("Erreur lors de l'approbation groupée");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: DepartmentReport['status']) => {
        if (!hasPermission('MANAGE_DEPARTMENT_REPORTS')) {
            showError("Permissions insuffisantes pour modifier le statut du rapport.");
            return;
        }
        try {
            await updateReportStatus(id, status);
            showSuccess(`Rapport marqué comme ${status}`);
            if (viewReport?.id === id) setViewReport(null);
        } catch (error) {
            showError("Erreur lors de la mise à jour");
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-serif font-medium text-primary dark:text-white mb-1">Gestion des Rapports</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Superviser et valider les rapports des départements</p>
                </div>
                <div className="flex gap-3">
                    {selectedReports.length > 0 && (
                        <Button
                            onClick={handleBulkApprove}
                            isLoading={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <CheckIcon className="w-4 h-4 mr-2" />
                            Approuver ({selectedReports.length})
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 rounded-3xl border border-slate-100 dark:border-dark shadow-sm dark:shadow-none sticky top-24">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                            <FilterIcon className="w-3 h-3" /> Filtres
                        </h3>
                        <div className="space-y-2">
                            {['All', 'En attente', 'Approuvé', 'Révisé', 'Archivé'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status as any)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${filterStatus === status ? 'bg-primary text-white shadow-lg dark:shadow-none shadow-primary dark:shadow-none/30' : 'bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
                                >
                                    <span>{status === 'All' ? 'Tous les rapports' : status}</span>
                                    <Badge className={`bg-card dark:bg-card-dark text-current ${filterStatus === status ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {departmentReports.filter(r => status === 'All' ? true : r.status === status).length}
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Reports List */}
                <div className="lg:col-span-3">
                    <Card className="bg-card dark:bg-card-dark border border-slate-100 dark:border-dark rounded-3xl shadow-sm dark:shadow-none overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-white/[0.02]/50 border-b border-slate-100 dark:border-dark">
                                    <tr>
                                        <th className="px-6 py-4 text-left w-12">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={filteredReports.length > 0 && selectedReports.length === filteredReports.length}
                                                className="w-4 h-4 rounded border-slate-300 text-primary dark:text-white focus:ring-primary"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-400 tracking-widest">Département</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-400 tracking-widest">Période</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-400 tracking-widest">Date Soumission</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-400 tracking-widest">Statut</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-400 tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Chargement...</td></tr>
                                    ) : filteredReports.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Aucun rapport trouvé</td></tr>
                                    ) : (
                                        filteredReports.map((report) => (
                                            <tr key={report.id} className="hover:bg-slate-50 dark:bg-white/[0.02]/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedReports.includes(report.id)}
                                                        onChange={() => handleSelectReport(report.id)}
                                                        className="w-4 h-4 rounded border-slate-300 text-primary dark:text-white focus:ring-primary"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700 dark:text-white text-sm">{getDepartmentName(report.departmentId)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 capitalize">
                                                    {report.month} {report.year}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(report.submittedAt).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`${report.status === 'Approuvé' ? 'bg-emerald-100 text-emerald-800' : report.status === 'Révisé' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {report.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setViewReport(report)}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-primary dark:text-white hover:bg-primary/5 transition-colors"
                                                            title="Voir détails"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                        </button>
                                                        {report.fileUrl && (
                                                            <a
                                                                href={report.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                                title="Télécharger"
                                                            >
                                                                <DownloadIcon className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* View/Review Report Modal */}
            <Modal isOpen={!!viewReport} onClose={() => setViewReport(null)} title={`Rapport - ${viewReport ? getDepartmentName(viewReport.departmentId) : ''}`}>
                {viewReport && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start p-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Période</p>
                                <p className="font-bold text-lg capitalize">{viewReport.month} {viewReport.year}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Soumis le</p>
                                    <p className="font-bold">{new Date(viewReport.submittedAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-primary dark:text-white text-xs font-bold hover:underline"
                                    >
                                        Modifier le contenu
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Contenu du rapport</label>
                                    <textarea
                                        className="w-full h-64 p-4 border border-slate-200 dark:border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={editForm.content}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mois</label>
                                        <select
                                            className="w-full p-2 border border-slate-200 dark:border-dark rounded-lg"
                                            value={editForm.month}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, month: e.target.value }))}
                                        >
                                            {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Année</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-slate-200 dark:border-dark rounded-lg"
                                            value={editForm.year}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Annuler</Button>
                                    <Button onClick={handleSaveEdit} isLoading={isSubmitting}>Enregistrer</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Contenu</p>
                                    <div className="p-4 bg-card dark:bg-card-dark border border-slate-200 dark:border-dark rounded-xl text-sm leading-relaxed text-slate-700 dark:text-white whitespace-pre-wrap">
                                        {viewReport.content}
                                    </div>
                                </div>

                                {viewReport.fileUrl && (
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Pièce Jointe</p>
                                        <a
                                            href={viewReport.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors group"
                                        >
                                            <div className="w-10 h-10 bg-card dark:bg-card-dark rounded-lg flex items-center justify-center text-blue-500 shadow-sm dark:shadow-none">
                                                <FileTextIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm">Voir le document joint</p>
                                                <p className="text-xs opacity-70">Cliquez pour ouvrir</p>
                                            </div>
                                            <DownloadIcon className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                        </a>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-dark">
                            <Button
                                onClick={() => handleStatusUpdate(viewReport.id, 'Approuvé')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3"
                            >
                                <CheckIcon className="w-4 h-4 mr-2" />
                                Approuver
                            </Button>
                            <Button
                                onClick={() => handleStatusUpdate(viewReport.id, 'Révisé')}
                                className="flex-1 bg-card dark:bg-card-dark border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 py-3"
                            >
                                <XIcon className="w-4 h-4 mr-2" />
                                Demander Révision
                            </Button>
                        </div>
                        <div className="pt-2">
                            <Button
                                onClick={async () => {
                                    const accepted = await confirm({
                                        title: 'Archiver ce rapport ?',
                                        message: 'Le rapport sera déplacé dans les archives. Vous pourrez toujours le consulter.',
                                        confirmLabel: 'Archiver',
                                        variant: 'warning',
                                    });
                                    if (accepted) {
                                        handleStatusUpdate(viewReport.id, 'Archivé');
                                    }
                                }}
                                variant="ghost"
                                className="w-full text-slate-400 hover:text-slate-600 dark:text-slate-400 py-2 text-xs"
                            >
                                Archiver ce rapport
                            </Button>
                            <Button
                                onClick={async () => {
                                    const accepted = await confirm({
                                        title: 'Supprimer définitivement ?',
                                        message: 'ATTENTION: Cette action est irréversible. Le rapport et sa pièce jointe seront supprimés définitivement.',
                                        confirmLabel: 'Supprimer définitivement',
                                        variant: 'danger',
                                    });
                                    if (accepted) {
                                        setIsSubmitting(true);
                                        try {
                                            if (viewReport.fileUrl && viewReport.fileUrl.includes('supabase.co')) {
                                                await deleteFile(viewReport.fileUrl);
                                            }
                                            await deleteDepartmentReport(viewReport.id, viewReport.storagePath);
                                            showSuccess("Rapport supprimé définitivement");
                                            setViewReport(null);
                                        } catch (error) {
                                            showError("Erreur lors de la suppression");
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }
                                }}
                                variant="ghost"
                                className="w-full text-red-300 hover:text-red-600 py-2 text-xs hover:bg-red-50 dark:bg-red-900/20 mt-1"
                            >
                                Supprimer définitivement
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            <ConfirmDialog {...confirmState} onCancel={cancelConfirm} />
        </div>
    );
};

export default ReportsAdminPage;
