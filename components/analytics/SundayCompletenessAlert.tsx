
import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';

interface MissingReport {
    service: string;
    missingAttendance: boolean;
    missingFinance: boolean;
}

const EXPECTED_SERVICES = [
    '1er Culte (Dim)',
    '2ème Culte (Dim)',
    '3ème Culte (Dim)',
];

function getLastSundayDate(): string {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const daysSinceSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - daysSinceSunday);
    return lastSunday.toISOString().split('T')[0];
}

function normalizeServiceName(name: string): string {
    return name?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
}

const SundayCompletenessAlert: React.FC = () => {
    const { attendance, financeRecords, isLoading } = useData();

    const { missing, lastSundayDate, isMonday } = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        // Show alert Mon-Wed (days 1-3) after Sunday  
        const isRelevantDay = dayOfWeek >= 0 && dayOfWeek <= 3;
        const lastSunday = getLastSundayDate();

        if (!isRelevantDay || !attendance || !financeRecords) {
            return { missing: [], lastSundayDate: lastSunday, isMonday: isRelevantDay };
        }

        const sundayAttendance = (attendance || []).filter(a =>
            a.date === lastSunday
        );
        const sundayFinances = (financeRecords || []).filter(f =>
            f.date === lastSunday && f.type !== 'Dépense'
        );

        const gaps: MissingReport[] = [];

        for (const service of EXPECTED_SERVICES) {
            const normalizedService = normalizeServiceName(service);
            const hasAttendance = sundayAttendance.some(a =>
                normalizeServiceName(a.sessionName).includes(normalizedService.split(' ')[0]) &&
                normalizeServiceName(a.sessionName).includes('culte')
            );
            const hasFinance = sundayFinances.some(f =>
                normalizeServiceName(f.serviceName || '').includes(normalizedService.split(' ')[0]) &&
                normalizeServiceName(f.serviceName || '').includes('culte')
            );

            if (!hasAttendance || !hasFinance) {
                gaps.push({
                    service,
                    missingAttendance: !hasAttendance,
                    missingFinance: !hasFinance,
                });
            }
        }

        return { missing: gaps, lastSundayDate: lastSunday, isMonday: isRelevantDay };
    }, [attendance, financeRecords]);

    if (isLoading || !isMonday || missing.length === 0) return null;

    const formattedDate = new Date(lastSundayDate + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 bg-white border border-border shadow-admin rounded-lg overflow-hidden"
            >
                <div className="flex">
                    {/* Severity colored strip */}
                    <div className="w-1.5 bg-[#D81124] shrink-0" />

                    <div className="p-4 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4 text-[#D81124]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                                Action Requise : Rapports Manquants
                            </h3>
                            <span className="ml-auto text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                {formattedDate}
                            </span>
                        </div>

                        <div className="space-y-0">
                            {missing.map((gap, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <span className="font-semibold text-slate-800">{gap.service}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {gap.missingAttendance && <span className="text-[10px] uppercase font-bold tracking-widest text-[#D81124] bg-red-50 border border-red-100 px-2.5 py-1 rounded">Présences</span>}
                                        {gap.missingFinance && <span className="text-[10px] uppercase font-bold tracking-widest text-[#D81124] bg-red-50 border border-red-100 px-2.5 py-1 rounded">Offrandes</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-medium">
                                Saisissez les données urgemment pour clôturer les métriques du dimanche.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SundayCompletenessAlert;
