import React from 'react';
import Card from '../ui/Card';
import { useData } from '../../context/DataContext';
import { SparklesIcon, CalendarIcon } from '../icons/Icons';

const OngoingEventsWidget: React.FC = () => {
    const { events, annualProgramme } = useData();
    const now = new Date();

    // Find ongoing events from events array (must strictly span more than 1 day to be a tracked seminar)
    const ongoingOneOffEvents = (events || []).filter(e => {
        const eStart = new Date(e.start);
        const eEnd = new Date(e.end);
        // Needs to span multiple days
        const isMultiDay = (eEnd.getTime() - eStart.getTime()) > (24 * 60 * 60 * 1000);
        return eStart <= now && eEnd >= now && isMultiDay;
    });

    // Find ongoing events from annualProgramme
    const ongoingAnnualEvents = (annualProgramme || []).filter(e => {
        const eStart = new Date(e.startDate);
        const eEnd = new Date(e.endDate);
        const isMultiDay = e.startDate !== e.endDate;
        return eStart <= now && eEnd >= now && isMultiDay;
    });

    const allOngoing = [
        ...ongoingOneOffEvents.map(e => ({
            id: e.id,
            title: e.title,
            start: new Date(e.start),
            end: new Date(e.end),
            type: e.type || e.category || 'Événement',
            location: e.location
        })),
        ...ongoingAnnualEvents.map(e => ({
            id: e.id,
            title: e.title,
            start: new Date(e.startDate),
            end: new Date(e.endDate),
            type: e.category || 'Programme Spécial',
            location: e.location
        }))
    ];

    if (allOngoing.length === 0) return null;

    return (
        <div className="space-y-4 mb-8">
            {allOngoing.map(event => {
                // Reset hours for accurate day calculation
                const start = new Date(event.start);
                start.setHours(0, 0, 0, 0);

                const end = new Date(event.end);
                end.setHours(23, 59, 59, 999);

                const today = new Date(now);
                today.setHours(12, 0, 0, 0);

                const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const currentDayNumber = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                // Safety bounds
                const displayDay = Math.min(Math.max(currentDayNumber, 1), totalDays);
                const progressPercentage = Math.min(Math.max((displayDay / totalDays) * 100, 0), 100);

                return (
                    <Card key={event.id} className="mb-4 bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-widest mb-2 border border-slate-200">
                                    {event.type}
                                </span>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                                    {event.title}
                                </h3>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Jour Actuel</div>
                                <div className="text-2xl font-bold text-slate-800">
                                    {displayDay}
                                    <span className="text-sm text-slate-400 font-bold ml-1">/ {totalDays}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-2">
                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                <span>{event.start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                <span>{event.end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export default OngoingEventsWidget;
