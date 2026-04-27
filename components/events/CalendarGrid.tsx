import React, { useMemo } from 'react';
import { Event } from '../../types';
import { PlusCircleIcon } from '../icons/Icons';
import Badge from '../ui/Badge';

interface CalendarGridProps {
    events: Event[];
    currentDate: Date;
    onEventClick: (event: Event) => void;
    onDayClick: (date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ events, currentDate, onEventClick, onDayClick }) => {
    const { days, monthLabel } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);

        // Days padding before start of month (Monday start)
        const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

        const daysData = [];

        // Add padding days from previous month
        for (let i = 0; i < startPadding; i++) {
            const d = new Date(year, month, 1 - (startPadding - i));
            daysData.push({ date: d, isCurrentMonth: false });
        }

        // Add days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            daysData.push({ date: d, isCurrentMonth: true });
        }

        // Add padding days for next month to complete the grid (42 cells max usually covers all)
        const remainingCells = 42 - daysData.length;
        for (let i = 1; i <= remainingCells; i++) {
            const d = new Date(year, month + 1, i);
            daysData.push({ date: d, isCurrentMonth: false });
        }

        const monthName = firstDay.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

        return { days: daysData, monthLabel: monthName };
    }, [currentDate]);

    const getEventsForDay = (date: Date) => {
        return events.filter(e => {
            const eDate = new Date(e.start);
            return eDate.getDate() === date.getDate() &&
                eDate.getMonth() === date.getMonth() &&
                eDate.getFullYear() === date.getFullYear();
        }).sort((a, b) => a.start.getTime() - b.start.getTime());
    };

    return (
        <div className="bg-card dark:bg-card-dark rounded-lg shadow-admin overflow-hidden border border-slate-100 dark:border-dark">
            <div className="bg-slate-50 dark:bg-white/[0.02] p-6 flex justify-between items-center border-b border-slate-100 dark:border-dark">
                <h3 className="text-xl font-black text-primary dark:text-white font-display uppercase italic">{monthLabel}</h3>
                <div className="flex gap-2">
                    {/* Navigation buttons could go here */}
                </div>
            </div>

            <div className="overflow-x-auto hide-scrollbar">
                <div className="min-w-[600px]">
                    <div className="grid grid-cols-7 border-b border-slate-100 dark:border-dark bg-slate-50 dark:bg-white/[0.02]/50">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                            <div key={day} className="py-3 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 auto-rows-fr">
                        {days.map((dayObj, idx) => {
                            const dayEvents = getEventsForDay(dayObj.date);
                            const isToday = new Date().toDateString() === dayObj.date.toDateString();

                            return (
                                <div
                                    key={idx}
                                    onClick={() => onDayClick(dayObj.date)}
                                    className={`min-h-[120px] p-2 border-b border-r border-slate-50 transition-colors group relative ${dayObj.isCurrentMonth ? 'bg-card dark:bg-card-dark hover:bg-slate-50' : 'bg-slate-50/30'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold ${isToday ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center' : dayObj.isCurrentMonth ? 'text-slate-700 dark:text-white' : 'text-slate-300'}`}>
                                            {dayObj.date.getDate()}
                                        </span>
                                        {dayObj.isCurrentMonth && (
                                            <button className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-primary dark:text-white transition-opacity">
                                                <PlusCircleIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map(event => {
                                            const isSpecial = event.type === 'Programme Spécial';
                                            const isCulte = event.type === 'Culte' || event.title.toLowerCase().includes('culte');

                                            return (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold truncate cursor-pointer transition-all hover:scale-[1.02] ${isSpecial ? 'bg-amber-100 text-amber-800 border border-amber-200 ring-1 ring-amber-400/30' : isCulte ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark'}`}
                                                >
                                                    {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {event.title}
                                                </div>
                                            );
                                        })}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[9px] font-bold text-slate-400 pl-1">
                                                + {dayEvents.length - 3} autres
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarGrid;
