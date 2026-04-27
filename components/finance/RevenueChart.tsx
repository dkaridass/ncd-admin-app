import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { FinanceRecord } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
    records: FinanceRecord[];
    periodLabel: string;
}

const RevenueChart: React.FC<Props> = ({ records, periodLabel }) => {
    // Group records by week or month depending on date range
    const chartData = useMemo(() => {
        const dataMap = new Map<string, { week: string; usd: number; cdf: number }>();

        records
            .filter(r => r.type !== 'Dépense') // Only income
            .forEach(record => {
                // Group by week (simple approach: use ISO week)
                const date = new Date(record.date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
                const weekKey = weekStart.toISOString().split('T')[0];
                const weekLabel = `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

                const existing = dataMap.get(weekKey) || { week: weekLabel, usd: 0, cdf: 0 };

                if (record.currency === 'USD') {
                    existing.usd += record.amount;
                } else {
                    existing.cdf += record.amount;
                }

                dataMap.set(weekKey, existing);
            });

        // Convert to array and sort by date
        return Array.from(dataMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([_, data]) => data)
            .slice(-8); // Last 8 periods
    }, [records]);

    if (chartData.length === 0) {
        return (
            <Card className="border-none shadow-sm rounded-lg p-8">
                <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-4">Tendances des Revenus</h3>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-slate-400">Aucune donnée de revenus pour cette période</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm rounded-lg p-8">
            <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-6">Tendances des Revenus - {periodLabel}</h3>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCdf" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="week"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px',
                            }}
                            formatter={(value: number, name: string) => [
                                name === 'usd' ? `$${value.toLocaleString()}` : `FC ${value.toLocaleString()}`,
                                name === 'usd' ? 'USD' : 'CDF'
                            ]}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => value === 'usd' ? 'Revenus USD' : 'Revenus CDF'}
                        />
                        <Line
                            type="monotone"
                            dataKey="usd"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ fill: '#10B981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="cdf"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default RevenueChart;
