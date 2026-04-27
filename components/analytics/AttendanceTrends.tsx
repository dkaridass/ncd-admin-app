
import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { motion } from 'framer-motion';
import AnimatedCounter from '../ui/AnimatedCounter';

type Period = '3M' | '6M' | '12M';

const AttendanceTrends: React.FC = () => {
    const { attendance } = useData();
    const [period, setPeriod] = useState<Period>('3M');

    const periodMonths = period === '3M' ? 3 : period === '6M' ? 6 : 12;

    const trendData = useMemo(() => {
        if (!attendance?.length) return [];

        const now = new Date();
        const cutoff = new Date(now.getFullYear(), now.getMonth() - periodMonths, 1);
        const cutoffStr = cutoff.toISOString().split('T')[0];

        const filtered = attendance.filter(a => a.date >= cutoffStr);

        // Group by week
        const weeklyMap = new Map<string, { total: number; men: number; women: number; children: number; visitors: number; count: number }>();

        filtered.forEach(a => {
            const d = new Date(a.date);
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            const existing = weeklyMap.get(weekKey) || { total: 0, men: 0, women: 0, children: 0, visitors: 0, count: 0 };
            existing.total += a.totalCount || (a.menCount + a.womenCount + a.childrenCount);
            existing.men += a.menCount || 0;
            existing.women += a.womenCount || 0;
            existing.children += a.childrenCount || 0;
            existing.visitors += a.visitorCount || 0;
            existing.count += 1;
            weeklyMap.set(weekKey, existing);
        });

        return Array.from(weeklyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([week, data]) => ({
                week,
                label: new Date(week).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                ...data,
            }));
    }, [attendance, periodMonths]);

    const stats = useMemo(() => {
        if (!trendData.length) return { avg: 0, peak: 0, peakWeek: '', trend: 0, totalServices: 0 };

        const totals = trendData.map(w => w.total);
        const peak = Math.max(...totals);
        const peakIdx = totals.indexOf(peak);
        const avg = Math.round(totals.reduce((s, v) => s + v, 0) / totals.length);

        // Trend: compare last 4 weeks avg to previous 4 weeks avg
        const recent = totals.slice(-4);
        const previous = totals.slice(-8, -4);
        const recentAvg = recent.length ? recent.reduce((s, v) => s + v, 0) / recent.length : 0;
        const prevAvg = previous.length ? previous.reduce((s, v) => s + v, 0) / previous.length : 0;
        const trend = prevAvg > 0 ? Math.round(((recentAvg - prevAvg) / prevAvg) * 100) : 0;

        return {
            avg,
            peak,
            peakWeek: trendData[peakIdx]?.label || '',
            trend,
            totalServices: trendData.reduce((s, w) => s + w.count, 0),
        };
    }, [trendData]);

    const maxTotal = Math.max(...trendData.map(w => w.total), 1);

    return (
        <div className="bg-white rounded-lg border border-border shadow-admin overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-wide">
                            Tendances Présences
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            Évolution hebdomadaire
                        </p>
                    </div>
                    <div className="flex gap-1 p-1 shadow-sm border border-border rounded bg-slate-50">
                        {(['3M', '6M', '12M'] as Period[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1 text-xs font-bold transition-colors rounded-sm ${period === p ? 'bg-white text-primary shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-4 gap-4 mt-5">
                    <div className="text-center p-3 rounded border border-slate-100">
                        <p className="text-lg font-bold text-slate-800">
                            <AnimatedCounter value={stats.avg} />
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Moy/Semaine</p>
                    </div>
                    <div className="text-center p-3 rounded border border-slate-100">
                        <p className="text-lg font-bold text-indigo-600">
                            <AnimatedCounter value={stats.peak} />
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Record</p>
                    </div>
                    <div className="text-center p-3 rounded border border-slate-100">
                        <p className="text-lg font-bold text-slate-800">
                            <AnimatedCounter value={stats.totalServices} />
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cultes</p>
                    </div>
                    <div className="text-center p-3 rounded border border-slate-100">
                        <p className={`text-lg font-bold ${stats.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {stats.trend >= 0 ? '+' : ''}{stats.trend}%
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tendance</p>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="px-6 py-6">
                {trendData.length > 0 ? (
                    <div className="space-y-1.5">
                        {trendData.map((week, i) => (
                            <motion.div
                                key={week.week}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-3 group"
                            >
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 w-14 text-right shrink-0">
                                    {week.label}
                                </span>

                                {/* Stacked bar */}
                                <div className="flex-1 flex h-5 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-700/50">
                                    {week.men > 0 && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(week.men / maxTotal) * 100}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.03 }}
                                            className="bg-blue-500 dark:bg-blue-400 h-full"
                                            title={`Hommes: ${week.men}`}
                                        />
                                    )}
                                    {week.women > 0 && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(week.women / maxTotal) * 100}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.03 + 0.1 }}
                                            className="bg-pink-400 dark:bg-pink-400 h-full"
                                            title={`Femmes: ${week.women}`}
                                        />
                                    )}
                                    {week.children > 0 && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(week.children / maxTotal) * 100}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.03 + 0.2 }}
                                            className="bg-amber-400 dark:bg-amber-400 h-full"
                                            title={`Enfants: ${week.children}`}
                                        />
                                    )}
                                    {week.visitors > 0 && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(week.visitors / maxTotal) * 100}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.03 + 0.3 }}
                                            className="bg-emerald-400 dark:bg-emerald-400 h-full"
                                            title={`Visiteurs: ${week.visitors}`}
                                        />
                                    )}
                                </div>

                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 w-10 text-right shrink-0">
                                    {week.total}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                            Aucune donnée pour cette période
                        </p>
                    </div>
                )}

                {/* Legend */}
                {trendData.length > 0 && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 dark:border-dark">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-blue-500 dark:bg-blue-400" />
                            <span className="text-[9px] font-bold text-slate-400">Hommes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-pink-400" />
                            <span className="text-[9px] font-bold text-slate-400">Femmes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-amber-400" />
                            <span className="text-[9px] font-bold text-slate-400">Enfants</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-emerald-400" />
                            <span className="text-[9px] font-bold text-slate-400">Visiteurs</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceTrends;
