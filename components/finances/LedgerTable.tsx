
import React from 'react';
import { FinanceRecord } from '../../types';
import Badge from '../ui/Badge';
import { FileTextIcon } from '../icons/Icons';

import { TrashIcon } from '../icons/Icons';
import { useData } from '../../context/DataContext';

interface LedgerTableProps {
    records: FinanceRecord[];
}

const LedgerTable: React.FC<LedgerTableProps> = ({ records }) => {
    const { deleteFinanceRecord, hasPermission } = useData();
    const canManageFinances = hasPermission('DELETE_FINANCES');

    const formatAmount = (amount: number, currency: 'USD' | 'CDF') => {
        if (currency === 'CDF') return `FC ${amount.toLocaleString()}`;
        return `$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    const handleDelete = async (id: string, type: string) => {
        if (window.confirm(`Confirmer la suppression de cette opération : ${type} ?`)) {
            await deleteFinanceRecord(id);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/3">Opération</th>
                        <th className="px-6 py-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/6">Nature</th>
                        <th className="px-6 py-6 text-right text-[9px] font-black text-blue-900 uppercase tracking-widest w-1/4 bg-blue-50/50 border-l-2 border-r border-blue-100">Mvmt. CDF</th>
                        <th className="px-6 py-6 text-right text-[9px] font-black text-emerald-900 uppercase tracking-widest w-1/4 bg-emerald-50/50 border-r-2 border-emerald-100">Mvmt. USD</th>
                        {canManageFinances && <th className="px-4 py-6 w-10"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {records.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50/50 transition-all group">
                            <td className="px-8 py-5">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-primary group-hover:text-secondary transition-colors">{record.date}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
                                        {record.type === 'Dépense' ? record.notes : record.serviceName}
                                    </span>
                                    {record.memberName && <span className="text-[9px] text-indigo-400 font-bold mt-1 uppercase truncate">{record.memberName}</span>}
                                </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                                <Badge variant={
                                    record.type === 'Dépense' ? 'danger' :
                                        record.type === 'Action de grâce' ? 'warning' :
                                            record.type === 'Dons' ? 'success' :
                                                'primary'
                                } className="text-[8px] font-black uppercase tracking-tighter px-3 py-1 rounded-full shadow-sm">
                                    {record.type}
                                </Badge>
                            </td>

                            {/* CDF Column */}
                            <td className="px-6 py-5 text-right bg-blue-50/30 border-l-2 border-r border-blue-100 group-hover:bg-blue-50/60 transition-colors">
                                {record.currency === 'CDF' ? (
                                    <span className={`font-display font-black text-sm ${record.type === 'Dépense' ? 'text-red-400' : 'text-slate-700'}`}>
                                        {record.type === 'Dépense' ? '-' : '+'} {formatAmount(record.amount, 'CDF')}
                                    </span>
                                ) : (
                                    <span className="text-blue-200 text-xs font-black opacity-30">-</span>
                                )}
                            </td>

                            {/* USD Column */}
                            <td className="px-6 py-5 text-right bg-emerald-50/30 border-r-2 border-emerald-100 group-hover:bg-emerald-50/60 transition-colors">
                                {record.currency === 'USD' ? (
                                    <span className={`font-display font-black text-sm ${record.type === 'Dépense' ? 'text-red-500' : 'text-emerald-700'}`}>
                                        {record.type === 'Dépense' ? '-' : '+'} {formatAmount(record.amount, 'USD')}
                                    </span>
                                ) : (
                                    <span className="text-emerald-200 text-xs font-black opacity-30">-</span>
                                )}
                            </td>

                            {canManageFinances && (
                                <td className="px-4 py-5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDelete(record.id, record.type)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Supprimer"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                    {records.length === 0 && (
                        <tr>
                            <td colSpan={canManageFinances ? 5 : 4} className="py-24 text-center opacity-20">
                                <FileTextIcon className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em]">Journal vide</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LedgerTable;
