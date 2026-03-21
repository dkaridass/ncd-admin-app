import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CalendarIcon,
    TrendingUpIcon,
    LightningBoltIcon,
    ChevronRightIcon,
    ExclamationIcon,
    SparklesIcon
} from '../icons/Icons';
import { useData } from '../../context/DataContext';

const MorningPulseCard: React.FC = () => {
    const navigate = useNavigate();
    const dataContext = useData();
    const hasPermission = dataContext.hasPermission;
    // Safely destructure with defaults
    const dailyRhema = dataContext.dailyRhema;
    const financeRecords = dataContext.financeRecords || [];
    const events = dataContext.events || [];
    const weeklyServices = dataContext.weeklyServices || [];
    const annualProgramme = dataContext.annualProgramme || [];
    const tasks = dataContext.tasks || [];
    const departments = dataContext.departments || [];
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    // 1. Agenda Priority: Find all services today with their status
    const todayServicesWithStatus = React.useMemo(() => {
        if (!weeklyServices || !Array.isArray(weeklyServices)) {
            // Fallback to events or department meetings
            const now = new Date();
            if (events && Array.isArray(events)) {
                const todayEvents = events.filter(e => {
                    const eventDate = new Date(e.start);
                    return eventDate.getDate() === now.getDate() &&
                        eventDate.getMonth() === now.getMonth() &&
                        eventDate.getFullYear() === now.getFullYear();
                }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                if (todayEvents.length > 0) {
                    return [{
                        title: todayEvents[0].title,
                        time: `${String(new Date(todayEvents[0].start).getHours()).padStart(2, '0')}:${String(new Date(todayEvents[0].start).getMinutes()).padStart(2, '0')}`,
                        location: todayEvents[0].location || 'Salle Principale',
                        status: 'upcoming' as const,
                        type: 'event' as const
                    }];
                }
            }
            return [];
        }

        const now = new Date();
        const currentDay = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][now.getDay()];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentTimeNum = parseInt(currentTime.replace(':', ''));

        // Get all services for today, sorted by start time
        const todayServices = weeklyServices
            .filter(s => s.dayOfWeek === currentDay && s.isActive)
            .sort((a, b) => {
                const timeA = parseInt(a.startTime.replace(':', ''));
                const timeB = parseInt(b.startTime.replace(':', ''));
                return timeA - timeB;
            })
            .map(service => {
                const startTimeNum = parseInt(service.startTime.replace(':', ''));
                const endTimeNum = parseInt(service.endTime.replace(':', ''));

                let status: 'passed' | 'ongoing' | 'upcoming';
                if (currentTimeNum >= startTimeNum && currentTimeNum < endTimeNum) {
                    status = 'ongoing';
                } else if (currentTimeNum < startTimeNum) {
                    status = 'upcoming';
                } else {
                    status = 'passed';
                }

                return {
                    title: service.serviceName,
                    time: service.startTime,
                    endTime: service.endTime,
                    location: service.location || 'Paroisse La Pentecôte',
                    status,
                    type: 'service' as const,
                    order: service.order || 0
                };
            });

        return todayServices;
    }, [weeklyServices, events]);

    // Get the priority service (ongoing first, then next upcoming)
    const priorityService = React.useMemo(() => {
        const ongoing = todayServicesWithStatus.find(s => s.status === 'ongoing');
        if (ongoing) return ongoing;

        const upcoming = todayServicesWithStatus.find(s => s.status === 'upcoming');
        if (upcoming) return upcoming;

        // If all passed, show the last one
        return todayServicesWithStatus.length > 0 ? todayServicesWithStatus[todayServicesWithStatus.length - 1] : null;
    }, [todayServicesWithStatus]);

    // Next Annual Event
    const nextAnnualEvent = React.useMemo(() => {
        if (!annualProgramme || !Array.isArray(annualProgramme)) return null;

        const today = new Date().toISOString().split('T')[0];
        return annualProgramme
            .filter(e => e.isActive && e.startDate >= today)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0] || null;
    }, [annualProgramme]);

    // 2. Finance Pulse: This Week vs Last Week
    const financeStats = React.useMemo(() => {
        if (!financeRecords || !Array.isArray(financeRecords)) {
            return { total: 0, change: 0, isUp: false };
        }

        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfLastWeek = new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() - 7));

        const thisWeekTotal = financeRecords
            .filter(r => new Date(r.date) >= startOfWeek && r.type === 'Offrande')
            .reduce((sum, r) => sum + (r.currency === 'USD' ? r.amount : r.amount / 2800), 0);

        const lastWeekTotal = financeRecords
            .filter(r => {
                const d = new Date(r.date);
                return d >= startOfLastWeek && d < startOfWeek && r.type === 'Offrande';
            })
            .reduce((sum, r) => sum + (r.currency === 'USD' ? r.amount : r.amount / 2800), 0);

        const percentChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

        return {
            total: thisWeekTotal,
            change: Math.round(percentChange),
            isUp: percentChange >= 0
        };
    }, [financeRecords]);

    const pendingTasksCount = (tasks && Array.isArray(tasks) ? tasks : []).filter(t => t.status !== 'Terminé').length;

    return (
        <div className="w-full max-w-2xl mx-auto mb-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-[#0A0E1A] backdrop-blur-md rounded-[2rem] border border-slate-200/80 dark:border-white/[0.06] shadow-xl dark:shadow-none overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#0B1026] via-[#131A38] to-[#1A1F45] p-6 md:p-8 text-white relative overflow-hidden">
                    {/* Decorative orbs */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-[80px] -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-[60px] -ml-10 -mb-10"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
                                    <LightningBoltIcon className="w-3 h-3 text-amber-400" />
                                    <span className="text-[9px] font-black text-amber-300/80 uppercase tracking-[0.2em]">Pouls du Ministère</span>
                                </div>
                            </div>
                            <h2 className="text-3xl md:text-[2rem] font-serif font-medium tracking-tight mt-2 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Briefing Matinal</h2>
                            <p className="text-indigo-300/50 text-sm mt-1.5 capitalize font-medium">{today}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.15)] border-2 border-white/30 shrink-0">
                            <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=NCD&background=transparent&color=fff"; }} />
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Section 1: Agenda Priority */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-2" />
                            Priorité du Jour
                        </h3>

                        {/* Priority Service Card */}
                        {priorityService && (
                            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-start space-x-3 hover:border-primary/50 dark:hover:border-gold/30 hover:shadow-md dark:shadow-none transition-all duration-300 cursor-pointer active:scale-[0.98] group"
                                onClick={() => navigate('/events')}
                            >
                                <div className={`p-2 rounded-xl text-center min-w-[3.5rem] bg-slate-50 dark:bg-white/5 group-hover:bg-slate-100 transition-colors`}>
                                    <span className={`block text-xs font-bold ${priorityService.status === 'ongoing' ? 'text-emerald-600' : priorityService.status === 'upcoming' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {priorityService.time}
                                    </span>
                                    {priorityService.status === 'ongoing' && (
                                        <span className="block text-[8px] text-emerald-600 font-black uppercase mt-1">En cours</span>
                                    )}
                                    {priorityService.status === 'upcoming' && (
                                        <span className="block text-[8px] text-primary dark:text-primary-light font-black uppercase mt-1">À venir</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-semibold text-sm group-hover:text-primary dark:group-hover:text-gold transition-colors ${priorityService.status === 'ongoing' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                                            {priorityService.title}
                                        </h4>
                                        {priorityService.status === 'ongoing' && (
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {priorityService.location}
                                        {priorityService.endTime && priorityService.status === 'ongoing' && (
                                            <span className="ml-2 text-emerald-600 font-bold">→ {priorityService.endTime}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* All Services Today List (if multiple services) */}
                        {todayServicesWithStatus.length > 1 && (
                            <div className="space-y-2 mt-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                    Tous les services aujourd'hui ({todayServicesWithStatus.length})
                                </p>
                                <div className="space-y-1.5">
                                    {todayServicesWithStatus.map((service, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${service.status === 'ongoing' ? 'bg-emerald-50 border border-emerald-200' : service.status === 'upcoming' ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-dark opacity-60'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${service.status === 'ongoing' ? 'text-emerald-700' : service.status === 'upcoming' ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-400'}`}>
                                                    {service.time}
                                                </span>
                                                <span className={`${service.status === 'ongoing' ? 'text-emerald-800 font-bold' : service.status === 'upcoming' ? 'text-slate-700 dark:text-white' : 'text-slate-400'}`}>
                                                    {service.title}
                                                </span>
                                            </div>
                                            {service.status === 'ongoing' && (
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            )}
                                            {service.status === 'upcoming' && (
                                                <span className="text-[9px] text-indigo-600 dark:text-indigo-300 font-bold">→</span>
                                            )}
                                            {service.status === 'passed' && (
                                                <span className="text-[9px] text-slate-400">✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No services fallback */}
                        {!priorityService && todayServicesWithStatus.length === 0 && (
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10">
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Aucun service prévu aujourd'hui</p>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Finance Pulse — only for users with VIEW_FINANCES */}
                    {hasPermission && hasPermission('VIEW_FINANCES') && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                <TrendingUpIcon className="w-3 h-3 mr-2" />
                                Alerte Finance
                            </h3>
                            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/50 active:scale-[0.98] transition-all duration-300 group shadow-sm dark:shadow-none hover:shadow-md"
                                onClick={() => navigate('/finances')}
                            >
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">Offrandes (Semaine)</p>
                                    <p className="text-3xl font-serif font-medium text-slate-800 dark:text-white tracking-tight">${financeStats.total.toLocaleString()}</p>
                                </div>
                                <div className={`px-2 py-1 rounded-lg border ${financeStats.isUp ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-red-50 border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'}`}>
                                    <span className="text-xs font-bold">
                                        {financeStats.isUp ? '+' : ''}{financeStats.change}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Section 3: Next Annual Event */}
                {nextAnnualEvent && (
                    <div className="px-6 pb-4">
                        <div
                            className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200 dark:border-white/10 cursor-pointer hover:border-primary/50 dark:hover:border-gold/30 hover:shadow-md transition-all duration-300 active:scale-[0.98] group flex justify-between items-center"
                            onClick={() => navigate('/events?tab=annuel')}
                        >
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                                    <SparklesIcon className="w-3 h-3 mr-2" />
                                    Prochain Événement Annuel
                                </h3>
                                <p className="text-lg font-serif font-medium text-primary dark:text-white group-hover:text-gold transition-colors">
                                    {nextAnnualEvent.title}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {new Date(nextAnnualEvent.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 4: Daily Rhema */}
                <div className="px-6 pb-6">
                    <div className="bg-white dark:bg-white/[0.02] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] border-l-4 border-l-amber-400 dark:border-l-amber-500/60 shadow-sm dark:shadow-none relative group overflow-hidden transition-all hover:shadow-md">
                        <div className="absolute opacity-5 -top-4 -right-2 transform rotate-12">
                            <span className="font-serif text-9xl">"</span>
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Rhéma du Jour</h3>
                        {dailyRhema ? (
                            <>
                                <p className="text-slate-800 dark:text-slate-200 font-serif font-medium text-xl leading-snug italic relative z-10">
                                    "{dailyRhema.content}"
                                </p>
                                <p className="text-[10px] text-primary dark:text-gold font-black uppercase tracking-widest mt-4 text-right">— {dailyRhema.reference}</p>
                            </>
                        ) : (
                            <p className="text-slate-400 italic text-sm font-serif">Chargement de la parole du jour...</p>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-slate-50/80 dark:bg-white/[0.015] px-6 py-4 flex justify-between items-center border-t border-slate-100 dark:border-white/[0.04]">
                    <p className="text-xs text-slate-400 dark:text-white/30 font-medium">{pendingTasksCount} tâches en attente</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center hover:text-indigo-700 dark:hover:text-indigo-300 group transition-colors"
                    >
                        Voir le dashboard
                        <ChevronRightIcon className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default MorningPulseCard;
