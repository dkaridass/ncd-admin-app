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
                className="bg-white/90 backdrop-blur-md rounded-[2rem] border border-white shadow-xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2 text-indigo-200 text-xs font-bold tracking-widest uppercase mb-1">
                                <LightningBoltIcon className="w-3 h-3" />
                                <span>Pouls du Ministère</span>
                            </div>
                            <h2 className="text-2xl font-serif font-medium">Briefing Matinal</h2>
                            <p className="text-indigo-200 text-sm mt-1 capitalize">{today}</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <img src="https://ui-avatars.com/api/?name=NCD&background=transparent&color=fff" alt="Logo" className="w-8 h-8" />
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
                            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start space-x-3 hover:bg-indigo-50 transition-colors cursor-pointer group"
                                onClick={() => navigate('/events')}
                            >
                                <div className={`p-2 rounded-xl text-center min-w-[3.5rem] shadow-sm ${
                                    priorityService.status === 'ongoing' ? 'bg-emerald-100' : 
                                    priorityService.status === 'upcoming' ? 'bg-indigo-100' : 
                                    'bg-white'
                                }`}>
                                    <span className={`block text-xs font-bold ${
                                        priorityService.status === 'ongoing' ? 'text-emerald-700' : 
                                        priorityService.status === 'upcoming' ? 'text-indigo-700' : 
                                        'text-slate-500'
                                    }`}>
                                        {priorityService.time}
                                    </span>
                                    {priorityService.status === 'ongoing' && (
                                        <span className="block text-[8px] text-emerald-600 font-black uppercase mt-1">En cours</span>
                                    )}
                                    {priorityService.status === 'upcoming' && (
                                        <span className="block text-[8px] text-indigo-600 font-black uppercase mt-1">À venir</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-semibold text-sm group-hover:text-indigo-700 transition-colors ${
                                            priorityService.status === 'ongoing' ? 'text-emerald-700' : 'text-slate-800'
                                        }`}>
                                            {priorityService.title}
                                        </h4>
                                        {priorityService.status === 'ongoing' && (
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">
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
                                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                                                service.status === 'ongoing' 
                                                    ? 'bg-emerald-50 border border-emerald-200' 
                                                    : service.status === 'upcoming'
                                                    ? 'bg-indigo-50 border border-indigo-100'
                                                    : 'bg-slate-50 border border-slate-100 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${
                                                    service.status === 'ongoing' ? 'text-emerald-700' : 
                                                    service.status === 'upcoming' ? 'text-indigo-700' : 
                                                    'text-slate-400'
                                                }`}>
                                                    {service.time}
                                                </span>
                                                <span className={`${
                                                    service.status === 'ongoing' ? 'text-emerald-800 font-bold' : 
                                                    service.status === 'upcoming' ? 'text-slate-700' : 
                                                    'text-slate-400'
                                                }`}>
                                                    {service.title}
                                                </span>
                                            </div>
                                            {service.status === 'ongoing' && (
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            )}
                                            {service.status === 'upcoming' && (
                                                <span className="text-[9px] text-indigo-600 font-bold">→</span>
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
                            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                <p className="text-sm text-slate-500 text-center">Aucun service prévu aujourd'hui</p>
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
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors group"
                                onClick={() => navigate('/finances')}
                            >
                                <div>
                                    <p className="text-xs text-emerald-600 font-medium mb-0.5">Offrandes (Semaine)</p>
                                    <p className="text-lg font-bold text-slate-800">${financeStats.total.toLocaleString()}</p>
                                </div>
                                <div className="bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-100">
                                    <span className={`text-xs font-bold ${financeStats.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
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
                            className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-2xl border border-primary/20 cursor-pointer hover:from-primary/20 hover:to-secondary/20 transition-all group"
                            onClick={() => navigate('/events?tab=annuel')}
                        >
                            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center">
                                <SparklesIcon className="w-3 h-3 mr-2" />
                                Prochain Événement Annuel
                            </h3>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                                {nextAnnualEvent.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {new Date(nextAnnualEvent.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                )}

                {/* Section 4: Daily Rhema */}
                <div className="px-6 pb-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-400"></div>
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Rhéma du Jour</h3>
                        {dailyRhema ? (
                            <>
                                <p className="text-slate-700 italic font-medium leading-relaxed">
                                    "{dailyRhema.content}"
                                </p>
                                <p className="text-xs text-slate-400 font-bold mt-2 text-right">— {dailyRhema.reference}</p>
                            </>
                        ) : (
                            <p className="text-slate-400 italic text-sm">Chargement de la parole du jour...</p>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-slate-50/50 px-6 py-4 flex justify-between items-center border-t border-slate-100/50">
                    <p className="text-xs text-slate-400">{pendingTasksCount} tâches en attente</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="text-indigo-600 text-xs font-bold flex items-center hover:underline"
                    >
                        Voir le dashboard
                        <ChevronRightIcon className="w-3 h-3 ml-1" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default MorningPulseCard;
