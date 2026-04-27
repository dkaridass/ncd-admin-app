
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
        <div className="bg-white rounded-lg border border-border shadow-admin overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-wide">
                            Scoreboard Départements
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            {currentMonth.month} {currentMonth.year}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary font-display leading-none">{completionRate}%</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Taux de Remise</p>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-600">{counts.onTime} approuvés</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                        <span className="text-[10px] font-bold text-slate-600">{counts.pending} en attente</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                        <span className="text-[10px] font-bold text-slate-600">{counts.missing} manquants</span>
                    </div>
                </div>
            </div>

            {/* Department List */}
            <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <tbody>
                        {scores.map((dept, i) => (
                            <motion.tr
                                key={dept.id}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors"
                            >
                                <td className="py-2 pl-4 pr-2 text-center w-8">
                                    <span className="text-[10px] font-bold text-slate-400">{i + 1}</span>
                                </td>
                                <td className="p-2 w-8">
                                    <span className={`block w-2.5 h-2.5 rounded-sm mx-auto ${dept.status === 'on-time' ? 'bg-emerald-500' : dept.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'}`} />
                                </td>
                                <td className="p-2">
                                    <p className="text-xs font-bold text-slate-800 truncate">{dept.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                        {dept.category} • {dept.memberCount} membres
                                    </p>
                                </td>
                                <td className="p-2 text-right pr-6">
                                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold tracking-wide uppercase ${dept.status === 'on-time' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : dept.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                                        {dept.status === 'on-time' ? 'Approuvé' : dept.status === 'pending' ? 'En attente' : 'Manquant'}
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                        {scores.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                                    Aucun département
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DepartmentScoreboard;
