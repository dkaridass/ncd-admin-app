import React from 'react';
import Input from '../ui/Input';
import { CalendarIcon } from '../icons/Icons';

export type DateRangePreset = 'month' | 'quarter' | 'year' | 'custom';

interface Props {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    activePreset: DateRangePreset;
    onPresetChange: (preset: DateRangePreset) => void;
}

const DateRangeSelector: React.FC<Props> = ({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    activePreset,
    onPresetChange,
}) => {
    const presets = [
        { value: 'month' as DateRangePreset, label: 'Ce Mois' },
        { value: 'quarter' as DateRangePreset, label: 'Ce Trimestre' },
        { value: 'year' as DateRangePreset, label: 'Cette Année' },
        { value: 'custom' as DateRangePreset, label: 'Personnalisé' },
    ];

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-primary dark:text-white" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-white">Période de Rapport</h3>
            </div>

            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
                {presets.map((preset) => (
                    <button
                        key={preset.value}
                        onClick={() => onPresetChange(preset.value)}
                        type="button"
                        className={`px-6 py-3 rounded-lg text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${ activePreset === preset.value ? 'bg-primary text-white shadow-md dark:shadow-none' : 'bg-card dark:bg-card-dark border border-slate-200 dark:border-dark text-slate-700 dark:text-white hover:border-primary/50 hover:text-primary hover:bg-slate-50' }`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Custom Date Inputs */}
            {activePreset === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 dark:bg-white/[0.02] rounded-lg border border-slate-100 dark:border-dark">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Date de Début</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => onStartDateChange(e.target.value)}
                            className="rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Date de Fin</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => onEndDateChange(e.target.value)}
                            className="rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeSelector;
