
import React, { useState, useMemo } from 'react';
import { FinanceRecord } from '../../types';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { FileTextIcon } from '../icons/Icons';
import { TrashIcon } from '../icons/Icons';
import { useData } from '../../context/DataContext';
import { showSuccess, showError } from '../../utils/toast';

interface LedgerTableProps {
    records: FinanceRecord[];
    approvalFilter?: 'ALL' | 'PENDING' | 'APPROVED';
}

const LedgerTable: React.FC<LedgerTableProps> = ({ records, approvalFilter = 'ALL' }) => {
    const { deleteFinanceRecord, updateFinanceRecord, hasPermission, currentUser } = useData();
    const canManageFinances = hasPermission('DELETE_FINANCES');
    const canApprove = hasPermission('EDIT_FINANCES');
    const { confirmState, confirm, cancelConfirm } = useConfirm();

    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'LE PREMIER CULTE': true,
        'LE DEUXIEME CULTE': true,
        'LES SORTIES DE CAISSE': true,
        'AUTRES OPERATIONS': true
    });

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const filteredByApproval = approvalFilter === 'ALL'
        ? records
        : approvalFilter === 'PENDING'
            ? records.filter(r => !r.isApproved)
            : records.filter(r => r.isApproved);

    const formatAmount = (amount: number, currency: 'USD' | 'CDF') => {
        if (currency === 'CDF') return `FC ${amount.toLocaleString()}`;
        return `$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    const handleDelete = async (id: string, type: string) => {
        const accepted = await confirm({
            title: 'Supprimer cette opération ?',
            message: `Confirmer la suppression définitive de cette opération : ${type} ?`,
            confirmLabel: 'Supprimer',
            variant: 'danger',
        });
        if (accepted) {
            await deleteFinanceRecord(id);
        }
    };

    const handleApprove = async (record: FinanceRecord) => {
        setApprovingId(record.id);
        try {
            await updateFinanceRecord(record.id, {
                isApproved: true,
            });
            showSuccess(`✅ Opération approuvée`);
        } catch (e) {
            showError("Erreur lors de l'approbation");
        } finally {
            setApprovingId(null);
        }
    };

    const handleRevoke = async (record: FinanceRecord) => {
        setApprovingId(record.id);
        try {
            await updateFinanceRecord(record.id, {
                isApproved: false,
            });
            showSuccess("Approbation retirée");
        } catch (e) {
            showError("Erreur");
        } finally {
            setApprovingId(null);
        }
    };

    const pendingCount = records.filter(r => !r.isApproved).length;
    const approvedCount = records.filter(r => r.isApproved).length;

    // --- Grouping Logic ---
    const groupedRecords = useMemo(() => {
        const groups = {
            'LE PREMIER CULTE': { records: [] as FinanceRecord[], totalCDF: 0, totalUSD: 0 },
            'LE DEUXIEME CULTE': { records: [] as FinanceRecord[], totalCDF: 0, totalUSD: 0 },
            'LES SORTIES DE CAISSE': { records: [] as FinanceRecord[], totalCDF: 0, totalUSD: 0 },
            'AUTRES OPERATIONS': { records: [] as FinanceRecord[], totalCDF: 0, totalUSD: 0 }
        };

        filteredByApproval.forEach(record => {
            let groupKey = 'AUTRES OPERATIONS';

            const lowerService = record.serviceName?.toLowerCase() || '';
            const lowerNotes = record.notes?.toLowerCase() || '';

            if (record.type === 'Dépense') {
                groupKey = 'LES SORTIES DE CAISSE';
            } else if (lowerService.includes('1er culte') || lowerService.includes('premier culte') || lowerNotes.includes('1er culte') || lowerNotes.includes('premier culte')) {
                groupKey = 'LE PREMIER CULTE';
            } else if (lowerService.includes('2ème culte') || lowerService.includes('2eme culte') || lowerService.includes('deuxième culte') || lowerNotes.includes('2ème culte') || lowerNotes.includes('2eme culte')) {
                groupKey = 'LE DEUXIEME CULTE';
            }

            groups[groupKey as keyof typeof groups].records.push(record);
            if (record.currency === 'CDF') {
                groups[groupKey as keyof typeof groups].totalCDF += record.amount;
            } else {
                groups[groupKey as keyof typeof groups].totalUSD += record.amount;
            }
        });

        return groups;
    }, [filteredByApproval]);

    // Format utility for groups
    const renderGroupHeader = (groupName: string, data: { records: FinanceRecord[], totalCDF: number, totalUSD: number }, isMobile: boolean = false) => {
        const isExpanded = expandedGroups[groupName];

        if (isMobile) {
            return (
                <div key={`${groupName}-header`} onClick={() => toggleGroup(groupName)} className="p-4 bg-slate-100 flex justify-between items-center cursor-pointer border-b border-slate-200">
                    <h3 className="font-black text-xs text-slate-800 tracking-widest uppercase">{groupName} <span className="bg-slate-200 text-slate-500 rounded-full px-2 py-0.5 ml-2">{data.records.length}</span></h3>
                    <div className="flex items-center gap-3">
                        <div className="text-right flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-500">FC {data.totalCDF.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-emerald-600">$ {data.totalUSD.toLocaleString()}</span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            );
        }

        return (
            <tr key={`${groupName}-header`} onClick={() => toggleGroup(groupName)} className="bg-white cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200 group">
                <td colSpan={3} className="px-8 py-5">
                    <div className="flex items-center gap-4">
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        <h3 className="font-black text-[12px] text-slate-800 tracking-[0.15em] uppercase">{groupName}</h3>
                        <span className="bg-white border border-slate-200 text-slate-500 rounded-full px-3 py-1 text-[10px] font-bold shadow-sm">{data.records.length} opérations</span>
                    </div>
                </td>
                <td className="px-6 py-5 text-center bg-[#F8FAFC] border-l border-white">
                    <span className={`font-serif text-[15px] tracking-tight font-black ${groupName === 'LES SORTIES DE CAISSE' ? 'text-slate-600' : 'text-slate-900'}`}>
                        {data.totalCDF > 0 ? `FC ${data.totalCDF.toLocaleString()}` : '-'}
                    </span>
                </td>
                <td className="px-6 py-5 text-center bg-[#F2FAF5] border-l border-white">
                    <span className={`font-serif text-[15px] tracking-tight font-black ${groupName === 'LES SORTIES DE CAISSE' ? 'text-emerald-800' : 'text-emerald-700'}`}>
                        {data.totalUSD > 0 ? `$ ${data.totalUSD.toLocaleString()}` : '-'}
                    </span>
                </td>
                {canManageFinances && <td></td>}
            </tr>
        );
    };

    return (<>
        <div>
            {/* Approval Summary Strip */}
            {canApprove && (
                <div className="flex items-center gap-4 px-4 md:px-8 py-3 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-dark overflow-x-auto hide-scrollbar">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">Statut :</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{approvedCount} approuvées</span>
                    </div>
                    {pendingCount > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{pendingCount} en attente</span>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile Card List View */}
            <div className="md:hidden flex flex-col border-t border-slate-100 dark:border-dark">
                {(Object.entries(groupedRecords) as [string, { records: FinanceRecord[], totalCDF: number, totalUSD: number }][]).map(([groupName, data]) => (
                    <React.Fragment key={groupName}>
                        {renderGroupHeader(groupName, data, true)}
                        {expandedGroups[groupName] && (
                            <div className="divide-y divide-slate-50 border-b border-slate-200">
                                {data.records.map(record => (
                                    <div key={record.id} className="p-5 flex flex-col gap-4 bg-card dark:bg-card-dark relative hover:bg-slate-50/50 transition-colors pl-8 border-l-4 border-l-transparent hover:border-l-primary/20">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-start gap-3 overflow-hidden">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${record.type === 'Dépense' ? 'bg-red-50 text-red-500 dark:bg-red-500/10' :
                                                    record.type === 'Action de grâce' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10' :
                                                        record.type === 'Dons' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' :
                                                            'bg-blue-50 text-blue-500 dark:bg-blue-500/10'
                                                    }`}>
                                                    {record.type === 'Dépense' ? (
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider truncate mb-1">
                                                        {record.type === 'Dépense' ? record.notes : record.serviceName || record.type}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{record.date}</p>
                                                        <Badge variant={record.type === 'Dépense' ? 'danger' : 'primary'} className="text-[8px] px-1.5 py-0">
                                                            {record.type}
                                                        </Badge>
                                                        {record.receiptUrl && (
                                                            <a href={record.receiptUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-[12px] hover:scale-110 opacity-80 hover:opacity-100 transition-all" title="Voir le Reçu">📎</a>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`font-display font-black text-base ${record.type === 'Dépense' ? 'text-red-500' : record.currency === 'CDF' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {record.type === 'Dépense' ? '-' : '+'} {formatAmount(record.amount, record.currency)}
                                                </p>
                                                {record.isApproved ? (
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">✓ Approuvé</span>
                                                ) : (
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400 animate-pulse">⏳ Attente</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Row */}
                                        {(record.memberName || (record.type !== 'Dépense' && record.notes) || canManageFinances) && (
                                            <div className="flex justify-between items-end border-t border-slate-50 dark:border-slate-800/50 pt-3 mt-1">
                                                <div className="flex flex-col gap-1 overflow-hidden">
                                                    {record.memberName && (
                                                        <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase truncate">
                                                            👤 {record.memberName}
                                                        </span>
                                                    )}
                                                    {record.type !== 'Dépense' && record.notes && (
                                                        <span className="text-[10px] text-slate-400 italic truncate">{record.notes}</span>
                                                    )}
                                                </div>

                                                {canManageFinances && (
                                                    <div className="flex gap-1">
                                                        {canApprove && !record.isApproved && (
                                                            <button onClick={() => handleApprove(record)} className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDelete(record.id, record.type)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </React.Fragment>
                ))}

                {filteredByApproval.length === 0 && (
                    <div className="p-12 text-center opacity-40">
                        <FileTextIcon className="w-10 h-10 mx-auto mb-3" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                            {approvalFilter === 'PENDING' ? 'Aucune opération en attente' : 'Journal vide'}
                        </p>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-slate-200">
                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Opération</th>
                            <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/6">Nature</th>
                            <th className="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Statut</th>
                            <th className="px-6 py-6 text-center text-[10px] font-black text-blue-800 uppercase tracking-widest w-1/5 bg-[#F8FAFC]">Mvmt. CDF</th>
                            <th className="px-6 py-6 text-center text-[10px] font-black text-emerald-800 uppercase tracking-widest w-1/5 bg-[#F2FAF5]">Mvmt. USD</th>
                            {canManageFinances && <th className="px-4 py-6 w-20"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {(Object.entries(groupedRecords) as [string, { records: FinanceRecord[], totalCDF: number, totalUSD: number }][]).map(([groupName, data]) => (
                            <React.Fragment key={groupName}>
                                {renderGroupHeader(groupName, data, false)}

                                {expandedGroups[groupName] && data.records.map((record, idx, arr) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-all bg-white relative group">
                                        <td className="px-8 py-6 pl-12 relative align-top">
                                            {/* Sub-item connector line */}
                                            <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200"></div>
                                            <div className="absolute left-8 top-8 w-4 h-px bg-slate-200"></div>

                                            <div className="flex flex-col relative z-10 pl-2">
                                                <span className="text-[14px] font-black text-slate-800">{record.date}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 truncate">
                                                    {record.serviceName || (record.type === 'Dépense' ? record.notes : '')}
                                                </span>
                                                {(record.memberName || (record.type !== 'Dépense' && record.notes)) && (
                                                    <span className="text-[9px] text-indigo-500 font-black mt-1.5 uppercase truncate tracking-wider">
                                                        {record.type !== 'Dépense' && record.notes ? record.notes : ''} {record.memberName ? `- ${record.memberName}` : ''}
                                                    </span>
                                                )}
                                                {record.receiptUrl && (
                                                    <a href={record.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded w-fit transition-all border border-emerald-100">
                                                        📎 Reçu / Facture
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center align-top">
                                            {/* Precise Pill matching screenshot */}
                                            <span className={`inline-flex items-center px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest leading-tight text-center max-w-[140px] ${record.type === 'Dépense' ? 'bg-red-50 text-red-600' :
                                                record.type === 'Action de grâce' ? 'bg-[#FFF0E5] text-[#F9863B]' :
                                                    ['Dîme', 'Offrande', 'Offrande du prophète', 'Dons'].includes(record.type) ? 'bg-[#E5ECFF] text-[#5C5CFF]' :
                                                        'bg-[#E5ECFF] text-[#5C5CFF]'
                                                }`}>
                                                {record.type === 'Offrande du prophète' ? <><span className="hidden">OFFRANDE</span><br />DU PROPHETE</> : record.type}
                                            </span>
                                        </td>

                                        {/* Status Column */}
                                        <td className="px-4 py-6 text-center align-top">
                                            {record.isApproved ? (
                                                <div className="flex justify-center mt-1">
                                                    <span className="flex items-center justify-center w-5 h-5 rounded bg-[#E8F8EE] text-emerald-500">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center mt-1">
                                                    <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-50 text-amber-500 animate-pulse">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </span>
                                                </div>
                                            )}
                                        </td>

                                        {/* CDF Column */}
                                        <td className="px-6 py-6 text-center align-middle bg-[#F8FAFC] border-l border-white transition-colors relative">
                                            {record.currency === 'CDF' ? (
                                                <span className={`font-serif text-[15px] tracking-tight ${record.type === 'Dépense' ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    {record.type === 'Dépense' ? '- ' : '+ '}{formatAmount(record.amount, 'CDF')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-black opacity-50">-</span>
                                            )}
                                        </td>

                                        {/* USD Column */}
                                        <td className="px-6 py-6 text-center align-middle bg-[#F2FAF5] border-l border-white transition-colors">
                                            {record.currency === 'USD' ? (
                                                <span className={`font-serif text-[15px] font-medium tracking-tight ${record.type === 'Dépense' ? 'text-emerald-800' : 'text-emerald-700'}`}>
                                                    {record.type === 'Dépense' ? '- ' : '+ '}{formatAmount(record.amount, 'USD')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-black opacity-50">-</span>
                                            )}
                                        </td>

                                        {canManageFinances && (
                                            <td className="px-4 py-5 text-center align-middle opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex items-center gap-1 justify-end">
                                                    {canApprove && !record.isApproved && (
                                                        <button
                                                            onClick={() => handleApprove(record)}
                                                            disabled={approvingId === record.id}
                                                            className="p-2 text-slate-300 dark:text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:hover:bg-emerald-500/10 rounded-lg transition-all"
                                                            title="Approuver"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                    )}
                                                    {canApprove && record.isApproved && (
                                                        <button
                                                            onClick={() => handleRevoke(record)}
                                                            disabled={approvingId === record.id}
                                                            className="p-2 text-emerald-300 dark:text-emerald-600 hover:text-amber-500 hover:bg-amber-50 dark:bg-amber-900/20 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                                                            title="Retirer l'approbation"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(record.id, record.type)}
                                                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Supprimer"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}

                        {filteredByApproval.length === 0 && (
                            <tr>
                                <td colSpan={canManageFinances ? 6 : 5} className="py-24 text-center opacity-20">
                                    <FileTextIcon className="w-12 h-12 mx-auto mb-4" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em]">
                                        {approvalFilter === 'PENDING' ? 'Aucune opération en attente' :
                                            approvalFilter === 'APPROVED' ? 'Aucune opération approuvée' :
                                                'Journal vide'}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        <ConfirmDialog {...confirmState} onCancel={cancelConfirm} />
    </>);
};

export default LedgerTable;
