import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { useData } from '../../context/DataContext';

const AttendanceChart: React.FC = () => {
    const { attendance, weeklyServices } = useData();

    // Prepare data for the chart
    const chartData = useMemo(() => {
        // Sort by date ascending for the chart
        const sorted = [...attendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Take last 12 records to keep chart readable
        return sorted.slice(-12).map(record => ({
            date: new Date(record.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            fullDate: new Date(record.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            Hommes: record.menCount,
            Femmes: record.womenCount,
            Jeunes: record.youthCount || 0,
            Enfants: record.childrenCount,
            Visiteurs: record.visitorCount || 0,
            Total: record.totalCount,
            session: record.sessionName
        }));
    }, [attendance]);

    if (attendance.length === 0) {
        return (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-white/[0.02]/50 rounded-[2rem] border border-slate-100 dark:border-dark">
                <p className="font-bold text-sm">Aucune donnée de présence disponible</p>
                <p className="text-xs mt-1">Commencez par saisir les effectifs dans l'Agenda</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card dark:bg-card-dark p-4 border border-slate-100 dark:border-dark shadow-xl dark:shadow-none rounded-2xl">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">{payload[0].payload.fullDate}</p>
                    <p className="text-xs font-bold text-primary dark:text-white mb-3 border-b border-slate-100 dark:border-dark pb-2">
                        {payload[0].payload.session}
                    </p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-16">{entry.name}:</span>
                            <span className="text-xs font-black text-slate-800 dark:text-white">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card dark:bg-card-dark p-6 rounded-[2.5rem] shadow-sm dark:shadow-none border border-slate-100 dark:border-dark">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-[10px] font-black uppercase text-primary dark:text-white tracking-[0.3em]">Effectifs</h3>
                    <p className="text-xs text-slate-400 mt-1">12 derniers cultes enregistrés</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-200 uppercase">Total</span>
                    </div>
                </div>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="Total"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                        <Line type="monotone" dataKey="Hommes" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Femmes" stroke="#ec4899" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Jeunes" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Enfants" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Visiteurs" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AttendanceChart;
