import React, { useState, useEffect } from 'react';
import { DailyRhema } from '../../types';
import { rhemaService } from '../../services/rhemaService';
import { SparklesIcon, CalendarIcon, TrashIcon, CheckIcon, PlusIcon, EditIcon } from '../icons/Icons';
import Button from '../ui/Button';

const DailyRhemaAdminTab: React.FC = () => {
    const [rhemas, setRhemas] = useState<DailyRhema[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [targetDate, setTargetDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });

    const loadRhemas = async () => {
        setIsLoading(true);
        try {
            const data = await rhemaService.getAll();
            setRhemas(data);
        } catch (error) {
            console.error("Failed to load rhemas", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRhemas();
    }, []);

    const handleGenerate = async () => {
        if (!targetDate) return;
        setIsGenerating(true);
        try {
            // Check if one already exists for this date
            const existing = rhemas.find(r => r.date === targetDate);
            if (existing) {
                if (!window.confirm("Un verset existe déjà pour cette date. Voulez-vous le remplacer ?")) {
                    setIsGenerating(false);
                    return;
                }
                // Optional: delete existing or just let the new one be added and we filter later.
                // Ideally we update it. But generateDailyRhema creates a new one.
                await rhemaService.delete(existing.id);
            }

            const newRhema = await rhemaService.generateDailyRhema(targetDate);
            if (newRhema) {
                loadRhemas();
                alert(`✅ Verset généré avec succès pour le ${targetDate}`);
            }
        } catch (error) {
            console.error(error);
            alert("❌ Erreur lors de la génération. Veuillez réessayer.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id: string, date: string) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer le verset du ${date} ?`)) return;
        try {
            await rhemaService.delete(id);
            setRhemas(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            alert("Erreur lors de la suppression.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-100 dark:border-white/[0.04] shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-indigo-500" />
                    Générateur de Verset (Groq AI)
                </h3>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date cible</label>
                        <input
                            type="date"
                            className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-800 dark:text-white"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !targetDate}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 h-[42px] flex items-center justify-center min-w-[200px]"
                    >
                        {isGenerating ? 'Génération en cours...' : 'Générer via AI'}
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-white/[0.04] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-white/[0.04]">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Versets Programmés</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">Date</th>
                                <th className="p-4 font-bold">Thème</th>
                                <th className="p-4 font-bold">Verset</th>
                                <th className="p-4 font-bold">Contenu</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">Chargement des versets...</td>
                                </tr>
                            ) : rhemas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">Aucun verset programmé.</td>
                                </tr>
                            ) : (
                                rhemas.map((rhema) => (
                                    <tr key={rhema.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                <CalendarIcon className="w-3 h-3 mr-1" />
                                                {rhema.date}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700 dark:text-slate-200">{rhema.theme}</td>
                                        <td className="p-4 text-emerald-600 dark:text-emerald-400 font-medium">{rhema.reference}</td>
                                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={rhema.content}>
                                            {rhema.content}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(rhema.id, rhema.date)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyRhemaAdminTab;
