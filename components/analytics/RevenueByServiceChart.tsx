import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useData } from '../../context/DataContext';

const RevenueByServiceChart: React.FC = () => {
    const { financeRecords } = useData();
    const [currency, setCurrency] = useState<'CDF' | 'USD'>('USD');

    const chartData = useMemo(() => {
        // Filter for last 30 days to keep it relevant
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRecords = financeRecords.filter(r =>
            new Date(r.date) >= thirtyDaysAgo &&
            r.currency === currency &&
            r.type !== 'Dépense'
        );

        // Group by Service
        const serviceMap: Record<string, number> = {};

        recentRecords.forEach(record => {
            // Normalize service names
            let serviceName = record.serviceName || 'Autre';
            if (serviceName.includes('1er')) serviceName = '1er Culte';
            else if (serviceName.includes('2ème')) serviceName = '2ème Culte';
            else if (serviceName.includes('3ème')) serviceName = '3ème Culte';
            else if (serviceName.includes('Mercredi')) serviceName = 'Culte Mercredi';

            serviceMap[serviceName] = (serviceMap[serviceName] || 0) + record.amount;
        });

        const data = Object.keys(serviceMap).map(name => ({
            name,
            amount: serviceMap[name]
        }));

        // Sort by amount desc
        return data.sort((a, b) => b.amount - a.amount);
    }, [financeRecords, currency]);

    const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

    if (financeRecords.length === 0) {
        return (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-white/[0.02]/50 rounded-[2rem] border border-slate-100 dark:border-dark">
                <p className="font-bold text-sm">Aucune donnée financière disponible</p>
                <p className="text-xs mt-1">Les recettes par culte apparaîtront ici</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-card-dark p-3 border border-slate-100 dark:border-white/5 shadow-xl dark:shadow-none rounded-xl">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
                    <p className="text-sm font-black text-primary dark:text-gold">
                        {currency === 'USD' ? '$' : 'FC'} {payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card dark:bg-card-dark p-6 rounded-[2.5rem] shadow-sm dark:shadow-none border border-slate-100 dark:border-dark">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-[10px] font-black uppercase text-primary dark:text-white tracking-[0.3em]">Recettes</h3>
                    <p className="text-xs text-slate-400 mt-1">30 derniers jours</p>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setCurrency('USD')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currency === 'USD' ? 'bg-card dark:bg-card-dark text-primary shadow-sm dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                    >
                        USD
                    </button>
                    <button
                        onClick={() => setCurrency('CDF')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${currency === 'CDF' ? 'bg-card dark:bg-card-dark text-primary shadow-sm dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                    >
                        CDF
                    </button>
                </div>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }}
                            className="text-slate-400 dark:text-slate-500"
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }}
                            className="text-slate-400 dark:text-slate-500"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={50}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueByServiceChart;
