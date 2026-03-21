
import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { motion } from 'framer-motion';

interface DeptScore {
    id: string;
    name: string;
    category: string;
    memberCount: number;
    leaderName?: string;
    status: 'on-time' | 'pending' | 'missing';
    reportMonth?: string;
    reportStatus?: string;
}

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const DepartmentScoreboard: React.FC = () => {
    const { departments, departmentReports } = useData();

    const currentMonth = useMemo(() => {
        const now = new Date();
        return { month: MONTHS_FR[now.getMonth()], year: now.getFullYear() };
    }, []);

    const scores: DeptScore[] = useMemo(() => {
        if (!departments?.length) return [];

        return departments.map(dept => {
            const report = (departmentReports || []).find(
                r => r.departmentId === dept.id &&
                    r.month === currentMonth.month &&
                    r.year === currentMonth.year
            );

            let status: DeptScore['status'] = 'missing';
            if (report) {
                status = report.status === 'Approuvé' ? 'on-time' : 'pending';
            }

            return {
                id: dept.id,
                name: dept.name,
                category: dept.category,
                memberCount: dept.memberCount || 0,
                leaderName: dept.leaderName || dept.leaders?.[0]?.name,
                status,
                reportMonth: currentMonth.month,
                reportStatus: report?.status,
            };
        }).sort((a, b) => {
            const order = { 'on-time': 0, 'pending': 1, 'missing': 2 };
            return order[a.status] - order[b.status];
        });
    }, [departments, departmentReports, currentMonth]);

    const counts = useMemo(() => ({
        total: scores.length,
        onTime: scores.filter(s => s.status === 'on-time').length,
        pending: scores.filter(s => s.status === 'pending').length,
        missing: scores.filter(s => s.status === 'missing').length,
    }), [scores]);

    if (!departments?.length) return null;

    const completionRate = counts.total > 0 ? Math.round((counts.onTime / counts.total) * 100) : 0;

    return (
        <div className="bg-card dark:bg-card-dark rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-50 dark:border-dark">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                            📊 Scoreboard Départements
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            {currentMonth.month} {currentMonth.year}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-2xl font-black text-primary dark:text-gold font-display">{completionRate}%</p>
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Taux</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    {counts.onTime > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(counts.onTime / counts.total) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="bg-emerald-500 h-full"
                        />
                    )}
                    {counts.pending > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(counts.pending / counts.total) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                            className="bg-amber-400 h-full"
                        />
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{counts.onTime} approuvés</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{counts.pending} en attente</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{counts.missing} manquants</span>
                    </div>
                </div>
            </div>

            {/* Department List */}
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                {scores.map((dept, i) => (
                    <motion.div
                        key={dept.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 px-6 py-3 border-b border-slate-50 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-card dark:bg-card-dark/[0.02] transition-colors"
                    >
                        {/* Rank */}
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 w-5 text-right">
                            {i + 1}
                        </span>

                        {/* Status Indicator */}
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dept.status === 'on-time' ? 'bg-emerald-500' : dept.status === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-red-400' }`} />

                        {/* Department info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                {dept.name}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate">
                                {dept.category} • {dept.memberCount} membres
                            </p>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 ${dept.status === 'on-time' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : dept.status === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400' }`}>
                            {dept.status === 'on-time' ? '✓ Approuvé' :
                                dept.status === 'pending' ? '⏳ En attente' :
                                    '✗ Manquant'}
                        </span>
                    </motion.div>
                ))}

                {scores.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                            Aucun département
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentScoreboard;
