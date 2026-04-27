import React, { useState } from 'react';
import { FinanceRecord } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { showSuccess, showError } from '../../utils/toast';

interface PendingApprovalsTabProps {
    records: FinanceRecord[];
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string, reason: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const PendingApprovalsTab: React.FC<PendingApprovalsTabProps> = ({ records, onApprove, onReject, onDelete }) => {
    const pendingRecords = records.filter(r => r.isApproved === false && !r.rejectedReason);
    const rejectedRecords = records.filter(r => !!r.rejectedReason);

    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<FinanceRecord | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = async (record: FinanceRecord) => {
        setLoadingId(record.id);
        try {
            await onApprove(record.id);
            showSuccess(`✅ ${record.type} de ${record.amount.toLocaleString()} ${record.currency} approuvé`);
        } catch (e: any) {
            showError(`Erreur: ${e.message || 'Impossible d\'approuver'}`);
        } finally {
            setLoadingId(null);
        }
    };

    const openRejectModal = (record: FinanceRecord) => {
        setRejectTarget(record);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectTarget || !rejectReason.trim()) {
            showError('Veuillez indiquer un motif de rejet');
            return;
        }
        setLoadingId(rejectTarget.id);
        try {
            await onReject(rejectTarget.id, rejectReason.trim());
            showSuccess('Opération rejetée');
            setRejectModalOpen(false);
            setRejectTarget(null);
        } catch (e: any) {
            showError(`Erreur: ${e.message || 'Impossible de rejeter'}`);
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer définitivement cette opération rejetée ?')) return;
        setLoadingId(id);
        try {
            await onDelete(id);
            showSuccess('Opération supprimée');
        } catch (e: any) {
            showError(`Erreur: ${e.message}`);
        } finally {
            setLoadingId(null);
        }
    };

    const RecordRow: React.FC<{ record: FinanceRecord; showActions?: boolean }> = ({ record, showActions = true }) => (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-card-dark rounded-lg border border-slate-100 dark:border-dark hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${record.type === 'Dépense' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{record.type}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{record.date}</span>
                </div>
                <div className="flex items-baseline gap-3">
                    <span className={`text-xl font-display font-black ${record.type === 'Dépense' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {record.currency === 'CDF' ? 'FC' : '$'} {record.amount.toLocaleString()}
                    </span>
                    {record.memberName && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{record.memberName}</span>
                    )}
                </div>
                <div className="flex gap-3 mt-1">
                    <span className="text-[10px] text-slate-400">Par: <strong>{record.recordedBy}</strong></span>
                    {record.serviceName && <span className="text-[10px] text-slate-400">• {record.serviceName}</span>}
                    {record.account && <span className="text-[10px] text-slate-400">• {record.account}</span>}
                </div>
                {record.rejectedReason && (
                    <div className="mt-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="text-xs text-red-600 dark:text-red-400 font-bold">Motif de rejet : {record.rejectedReason}</span>
                    </div>
                )}
            </div>
            {showActions && !record.rejectedReason && (
                <div className="flex gap-2 flex-shrink-0">
                    <Button
                        onClick={() => handleApprove(record)}
                        disabled={loadingId === record.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors"
                    >
                        {loadingId === record.id ? '...' : '✓ Approuver'}
                    </Button>
                    <Button
                        onClick={() => openRejectModal(record)}
                        disabled={loadingId === record.id}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors"
                    >
                        ✗ Rejeter
                    </Button>
                </div>
            )}
            {record.rejectedReason && (
                <Button
                    onClick={() => handleDelete(record.id)}
                    disabled={loadingId === record.id}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors"
                >
                    Supprimer
                </Button>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Pending Section */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-black text-primary dark:text-white uppercase tracking-tight">En attente d'approbation</h3>
                    {pendingRecords.length > 0 && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black">
                            {pendingRecords.length}
                        </span>
                    )}
                </div>

                {pendingRecords.length === 0 ? (
                    <Card className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-dark">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl">✓</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Aucune opération en attente</p>
                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Toutes les opérations ont été traitées.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {pendingRecords.map(record => (
                            <RecordRow key={record.id} record={record} />
                        ))}
                    </div>
                )}
            </div>

            {/* Rejected Section */}
            {rejectedRecords.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Opérations rejetées</h3>
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-[10px] font-black">
                            {rejectedRecords.length}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {rejectedRecords.map(record => (
                            <RecordRow key={record.id} record={record} showActions={false} />
                        ))}
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Motif du Rejet">
                <div className="space-y-4">
                    {rejectTarget && (
                        <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-lg">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{rejectTarget.type} — {rejectTarget.currency === 'CDF' ? 'FC' : '$'} {rejectTarget.amount.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Par : {rejectTarget.recordedBy} • {rejectTarget.date}</p>
                        </div>
                    )}
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Indiquez le motif du rejet (obligatoire)..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark bg-white dark:bg-card-dark text-sm font-medium focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none"
                    />
                    <div className="flex gap-3 justify-end">
                        <Button onClick={() => setRejectModalOpen(false)} variant="secondary" className="rounded-lg px-6 py-3 text-xs font-black uppercase tracking-widest">
                            Annuler
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || loadingId === rejectTarget?.id}
                            className="rounded-lg px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest"
                        >
                            {loadingId === rejectTarget?.id ? '...' : 'Confirmer le Rejet'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PendingApprovalsTab;
