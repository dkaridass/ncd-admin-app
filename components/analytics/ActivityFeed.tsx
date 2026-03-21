
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auditService, AuditEntry, getActionInfo } from '../../services/auditService';
import { useData } from '../../context/DataContext';

const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<AuditEntry[]>([]);
    const { hasPermission } = useData();

    useEffect(() => {
        // Only subscribe to recent 20 activities
        const unsubscribe = auditService.subscribe(20, setActivities);
        return () => unsubscribe();
    }, []);

    if (!hasPermission('SUPER_ADMIN') && !hasPermission('MANAGE_SETTINGS')) {
        return null; // Only Admins see the global activity feed
    }

    const formatTimeAgo = (isoString: string) => {
        const diffMs = new Date().getTime() - new Date(isoString).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return `À l'instant`;
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays === 1) return `Hier`;
        return `Il y a ${diffDays} j`;
    };

    const getColorClass = (colorName: string) => {
        const map: Record<string, string> = {
            emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
            blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
            red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
            amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
            indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
            purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
            slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        };
        return map[colorName] || map.slate;
    };

    return (
        <div className="bg-card dark:bg-card-dark rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-slate-50 dark:border-dark">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    👁️ Historique d'Activité
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Dernières actions système
                </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <span className="text-4xl mb-4 opacity-50">🧭</span>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Aucune activité récente
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence>
                            {activities.map((entry, i) => {
                                const info = getActionInfo(entry.action);
                                return (
                                    <motion.div
                                        key={entry.id || i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-4 relative"
                                    >
                                        {/* Timeline Line */}
                                        {i !== activities.length - 1 && (
                                            <div className="absolute left-4 top-10 bottom-[-24px] w-px bg-slate-100 dark:bg-slate-800" />
                                        )}

                                        {/* Icon */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${getColorClass(info.color)}`}>
                                            <span className="text-sm">{info.icon}</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pt-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                    <span className="text-primary dark:text-gold">{entry.userName}</span>
                                                    <span className="opacity-60 font-medium"> a {info.label.toLowerCase()}</span>
                                                </p>
                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 shrink-0 uppercase">
                                                    {formatTimeAgo(entry.timestamp)}
                                                </span>
                                            </div>

                                            {entry.targetLabel && (
                                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg truncate inline-block max-w-full">
                                                    {entry.targetType === 'member' ? '👤 ' :
                                                        entry.targetType === 'finance' ? '💵 ' :
                                                            entry.targetType === 'attendance' ? '👥 ' : ''}
                                                    {entry.targetLabel}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
