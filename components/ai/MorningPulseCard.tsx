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
            <div className="bg-white rounded-lg shadow-admin border border-border overflow-hidden">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-border flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-200/50 px-2 py-0.5 rounded">
                                Pouls du Ministère
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Briefing Matinal</h2>
                        <p className="text-xs text-slate-500 mt-1 capitalize font-medium">{today}</p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                    {/* Section 1: Agenda Priority */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            Priorité du Jour
                        </h3>

                        {/* Priority Service Card */}
                        {priorityService && (
                            <div className="bg-white p-3 rounded-md border border-border flex items-start space-x-3 cursor-pointer hover:border-slate-300 transition-colors"
                                onClick={() => navigate('/events')}
                            >
                                <div className="px-2 py-1.5 rounded bg-slate-50 text-center min-w-[3.5rem] border border-slate-100">
                                    <span className={`block text-xs font-bold ${priorityService.status === 'ongoing' ? 'text-primary' : priorityService.status === 'upcoming' ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {priorityService.time}
                                    </span>
                                    {priorityService.status === 'ongoing' && (
                                        <span className="block text-[8px] text-primary font-black uppercase mt-0.5">En cours</span>
                                    )}
                                    {priorityService.status === 'upcoming' && (
                                        <span className="block text-[8px] text-slate-500 font-bold uppercase mt-0.5">À venir</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-bold text-sm text-slate-800">
                                            {priorityService.title}
                                        </h4>
                                        {priorityService.status === 'ongoing' && (
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {priorityService.location}
                                        {priorityService.endTime && priorityService.status === 'ongoing' && (
                                            <span className="ml-1 text-slate-600 font-medium">→ {priorityService.endTime}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* All Services Today List (if multiple services) */}
                        {todayServicesWithStatus.length > 1 && (
                            <div className="space-y-2 mt-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Tous les services ({todayServicesWithStatus.length})
                                </p>
                                <div className="space-y-1">
                                    {todayServicesWithStatus.map((service, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-2 rounded-md text-xs border ${service.status === 'ongoing' ? 'bg-blue-50/50 border-blue-100' : service.status === 'upcoming' ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 opacity-60'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${service.status === 'ongoing' ? 'text-primary' : service.status === 'upcoming' ? 'text-slate-700' : 'text-slate-400'}`}>
                                                    {service.time}
                                                </span>
                                                <span className={`${service.status === 'ongoing' ? 'text-primary font-bold' : service.status === 'upcoming' ? 'text-slate-800' : 'text-slate-400'}`}>
                                                    {service.title}
                                                </span>
                                            </div>
                                            {service.status === 'ongoing' && (
                                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No services fallback */}
                        {!priorityService && todayServicesWithStatus.length === 0 && (
                            <div className="p-3 bg-slate-50 rounded-md border border-dashed border-border">
                                <p className="text-xs text-slate-500 text-center">Aucun service prévu aujourd'hui</p>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Finance Pulse — only for users with VIEW_FINANCES */}
                    {hasPermission && hasPermission('VIEW_FINANCES') && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                Alerte Finance
                            </h3>
                            <div className="bg-white p-3 rounded-md border border-border flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
                                onClick={() => navigate('/finances')}
                            >
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Offrandes (Semaine)</p>
                                    <p className="text-xl font-bold text-slate-800">${financeStats.total.toLocaleString()}</p>
                                </div>
                                <div className={`px-2 py-0.5 rounded border ${financeStats.isUp ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-red-50 border-red-100 text-[#D81124]'}`}>
                                    <span className="text-[10px] font-bold tracking-wider">
                                        {financeStats.isUp ? '+' : ''}{financeStats.change}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Section 3: Next Annual Event */}
                {nextAnnualEvent && (
                    <div className="px-6 pb-4 bg-white">
                        <div
                            className="bg-slate-50 p-3 rounded-md border border-border cursor-pointer hover:border-slate-300 transition-colors flex justify-between items-center"
                            onClick={() => navigate('/events?tab=annuel')}
                        >
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                    Prochain Événement Annuel
                                </h3>
                                <p className="text-sm font-bold text-primary">
                                    {nextAnnualEvent.title}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 bg-white border border-border rounded">
                                    {new Date(nextAnnualEvent.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 4: Daily Rhema */}
                <div className="px-6 pb-6 bg-white">
                    <div className="bg-slate-50 p-4 rounded-md border border-border relative">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rhéma du Jour</h3>
                            <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                Focus sur Jésus
                            </span>
                        </div>
                        {dailyRhema ? (
                            <>
                                <p className="text-slate-800 text-sm font-medium italic border-l-2 border-primary pl-3">
                                    "{dailyRhema.content}"
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                                    — {dailyRhema.reference}
                                </p>
                                {dailyRhema.theme && (
                                    <p className="text-[9px] text-primary/70 font-bold uppercase tracking-widest mt-1">
                                        🎯 {dailyRhema.theme}
                                    </p>
                                )}
                                {dailyRhema.meditation && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            💭 {dailyRhema.meditation}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-slate-400 text-xs text-center p-2">Chargement du rhéma du jour...</p>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-slate-50 px-6 py-3 flex justify-between items-center border-t border-border">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{pendingTasksCount} Tâches</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                    >
                        Voir le dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MorningPulseCard;
