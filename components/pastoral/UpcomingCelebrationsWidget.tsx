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
        <Card title="Célébrations de la Semaine">
            <div className="space-y-0">
                {celebrations.map((c, idx) => (
                    <div
                        key={`${c.member.id}-${c.type}`}
                        className={`p-3 border-b border-border last:border-0 ${c.type === 'Mariage' ? 'hover:bg-rose-50/20' : 'hover:bg-amber-50/20'} flex items-center gap-3 transition-colors`}
                    >
                        <div className={`w-10 h-10 rounded shrink-0 border flex items-center justify-center ${c.type === 'Mariage' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-amber-50 border-amber-100 text-amber-500'}`}>
                            {c.type === 'Mariage' ? <HeartIcon className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
                                <span className="truncate pr-2">{c.member.name}</span>
                                <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${c.type === 'Mariage' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                    {c.daysUntil === 0 ? "Aujourd'hui" : `Dans ${c.daysUntil}j`}
                                </span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {c.type} • {c.years} {c.years > 1 ? 'ans' : 'an'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default UpcomingCelebrationsWidget;
