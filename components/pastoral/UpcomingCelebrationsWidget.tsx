import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { useData } from '../../context/DataContext';
import { HeartIcon, CalendarIcon } from '../icons/Icons';
import { Member } from '../../types';

interface Celebration {
    member: Member;
    type: 'Anniversaire' | 'Mariage';
    date: Date;
    daysUntil: number;
    years: number;
}

const UpcomingCelebrationsWidget: React.FC = () => {
    const { members, hasPermission } = useData();

    // Only viewable by pastoral care or admin
    if (!hasPermission('VIEW_PASTORAL_CARE') && !hasPermission('SUPER_ADMIN')) {
        return null;
    }

    const celebrations = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const soon: Celebration[] = [];

        const getDaysUntil = (dateStr: string): { days: number, nextDate: Date, years: number } | null => {
            if (!dateStr) return null;
            const parts = dateStr.split('-');
            if (parts.length !== 3) return null;

            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);

            let nextDate = new Date(today.getFullYear(), month, day);

            // If the date has already passed this year, next occurrence is next year
            if (nextDate < today) {
                nextDate = new Date(today.getFullYear() + 1, month, day);
            }

            const diffTime = Math.abs(nextDate.getTime() - today.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const years = nextDate.getFullYear() - year;

            return { days: diffDays, nextDate, years };
        };

        members.forEach(member => {
            if (member.status !== 'Fidèle') return;

            // Check Birthday
            const bdInfo = getDaysUntil(member.birthDate);
            if (bdInfo && bdInfo.days <= 7) {
                soon.push({
                    member,
                    type: 'Anniversaire',
                    date: bdInfo.nextDate,
                    daysUntil: bdInfo.days,
                    years: bdInfo.years
                });
            }

            // Check Wedding
            if (member.weddingDate) {
                const wdInfo = getDaysUntil(member.weddingDate);
                if (wdInfo && wdInfo.days <= 7) {
                    soon.push({
                        member,
                        type: 'Mariage',
                        date: wdInfo.nextDate,
                        daysUntil: wdInfo.days,
                        years: wdInfo.years
                    });
                }
            }
        });

        // Sort by closest date
        return soon.sort((a, b) => a.daysUntil - b.daysUntil);
    }, [members]);

    if (celebrations.length === 0) return null;

    return (
        <Card title="Célébrations de la Semaine" className="border-none shadow-premium dark:shadow-none rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 dark:bg-amber-900/20 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>

            <div className="space-y-4 relative z-10 mt-6">
                {celebrations.map((c, idx) => (
                    <div
                        key={`${c.member.id}-${c.type}`}
                        className={`p-4 rounded-2xl border ${c.type === 'Mariage' ? 'border-rose-100 bg-rose-50/30' : 'border-amber-100 bg-amber-50 dark:bg-amber-900/20/30'} flex items-start gap-4 hover:shadow-sm dark:shadow-none transition-all`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${c.type === 'Mariage' ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-500'}`}>
                            {c.type === 'Mariage' ? <HeartIcon className="w-6 h-6" /> : <CalendarIcon className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center justify-between">
                                {c.member.name}
                                <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${c.type === 'Mariage' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {c.daysUntil === 0 ? "Aujourd'hui" : `Dans ${c.daysUntil}j`}
                                </span>
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {c.type} • {c.years} {c.years > 1 ? 'ans' : 'an'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                                Le {c.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default UpcomingCelebrationsWidget;
