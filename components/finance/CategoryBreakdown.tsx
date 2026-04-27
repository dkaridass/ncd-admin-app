import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { FinanceRecord } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Props {
    records: FinanceRecord[];
    periodLabel: string;
}

const COLORS = {
    'Dîme': '#8B5CF6',
    'Offrande': '#10B981',
    'Action de grâce': '#F59E0B',
    'Offrande du prophète': '#EF4444',
    'Dons': '#3B82F6',
    'Dépense': '#DC2626',
};

const CategoryBreakdown: React.FC<Props> = ({ records, periodLabel }) => {
    const categoryData = useMemo(() => {
        const categoryMap = new Map<string, number>();

        records.forEach(record => {
            const existing = categoryMap.get(record.type) || 0;
            // Convert CDF to approximate USD for pie chart (rough conversion)
            const amount = record.currency === 'USD' ? record.amount : record.amount / 2500;
            categoryMap.set(record.type, existing + amount);
        });

        const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

        return Array.from(categoryMap.entries())
            .map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
            }))
            .sort((a, b) => b.value - a.value);
    }, [records]);

    if (categoryData.length === 0) {
        return (
            <Card className="border-none shadow-sm rounded-lg p-8">
                <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-4">Répartition par Catégorie</h3>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-slate-400">Aucune donnée pour cette période</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm rounded-lg p-8">
            <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-6">Répartition par Catégorie - {periodLabel}</h3>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name} (${percentage}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px',
                            }}
                            formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, entry: any) => `${value} (${entry.payload.percentage}%)`}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="mt-6 space-y-2">
                {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02] rounded-lg">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: COLORS[category.name as keyof typeof COLORS] || '#94a3b8' }}
                            />
                            <span className="text-sm font-bold text-slate-700 dark:text-white">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-primary dark:text-white">
                                ${category.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                {category.percentage}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default CategoryBreakdown;
