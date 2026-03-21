
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
                className="mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 shadow-sm dark:shadow-none"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="text-lg">⚠️</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
                            Rapports Incomplets — {formattedDate}
                        </h3>
                        <div className="space-y-1.5 mt-3">
                            {missing.map((gap, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span className="font-bold">{gap.service}:</span>
                                    <span>
                                        {gap.missingAttendance && gap.missingFinance
                                            ? 'présences et offrandes manquantes'
                                            : gap.missingAttendance
                                                ? 'rapport de présences manquant'
                                                : 'rapport d\'offrandes manquant'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-amber-500 dark:text-amber-600 mt-3 font-medium">
                            Utilisez le bouton ⊕ pour saisir rapidement les données manquantes
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SundayCompletenessAlert;
