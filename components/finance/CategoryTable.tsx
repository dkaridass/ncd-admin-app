import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { FinanceRecord } from '../../types';

interface Props {
    records: FinanceRecord[];
    periodLabel: string;
    onCategoryFilter?: (category: string | null) => void;
    activeCategory?: string | null;
}

const CategoryTable: React.FC<Props> = ({ records, periodLabel, onCategoryFilter, activeCategory }) => {
    const categoryData = useMemo(() => {
        const categoryMap = new Map<string, { usd: number; cdf: number }>();

        records.forEach(record => {
            const existing = categoryMap.get(record.type) || { usd: 0, cdf: 0 };

            if (record.currency === 'USD') {
                existing.usd += record.amount;
            } else {
                existing.cdf += record.amount;
            }

            categoryMap.set(record.type, existing);
        });

        // Calculate totals and percentages
        const totalUsd = Array.from(categoryMap.values()).reduce((sum, v) => sum + v.usd, 0);
        const totalCdf = Array.from(categoryMap.values()).reduce((sum, v) => sum + v.cdf, 0);
        const grandTotal = totalUsd + (totalCdf / 2500); // Rough conversion for percentage

        return Array.from(categoryMap.entries())
            .map(([category, amounts]) => {
                const total = amounts.usd + (amounts.cdf / 2500);
                return {
                    category,
                    usd: amounts.usd,
                    cdf: amounts.cdf,
                    total,
                    percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
                };
            })
            .sort((a, b) => b.total - a.total);
    }, [records]);

    if (categoryData.length === 0) {
        return (
            <Card className="border-none shadow-soft dark:shadow-none rounded-2xl p-8">
                <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-4">Analyse Détaillée par Catégorie</h3>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-slate-400">Aucune donnée pour cette période</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-soft dark:shadow-none rounded-2xl overflow-hidden">
            <div className="p-8 pb-0">
                <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-2">Analyse Détaillée par Catégorie</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Cliquez sur une catégorie pour filtrer les transactions</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-white/[0.02] border-y border-slate-100 dark:border-dark">
                        <tr>
                            <th className="px-8 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                Catégorie
                            </th>
                            <th className="px-4 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">
                                USD
                            </th>
                            <th className="px-4 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">
                                CDF
                            </th>
                            <th className="px-4 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">
                                Total (USD)
                            </th>
                            <th className="px-8 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">
                                % du Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {categoryData.map((row, index) => (
                            <tr
                                key={index}
                                onClick={() => onCategoryFilter?.(activeCategory === row.category ? null : row.category)}
                                className={`transition-colors cursor-pointer ${activeCategory === row.category ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50 dark:bg-white/[0.02]/50' }`}
                            >
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-3">
                                        {activeCategory === row.category && (
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        )}
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{row.category}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className="text-sm font-bold text-emerald-600">
                                        ${row.usd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className="text-sm font-bold text-blue-600">
                                        FC {row.cdf.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className="text-sm font-bold text-primary dark:text-white">
                                        ${row.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="flex-1 max-w-[100px] bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                                                style={{ width: `${row.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-black text-slate-600 dark:text-slate-400 min-w-[45px] text-right">
                                            {row.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default CategoryTable;
