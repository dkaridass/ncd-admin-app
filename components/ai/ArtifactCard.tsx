import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { FileTextIcon, SparklesIcon, XIcon, EditIcon, ShareIcon } from '../icons/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ArtifactCardProps {
    title: string;
    type: 'sermon' | 'briefing' | 'verse';
    content: {
        theme?: string;
        scripture?: string;
        introduction?: string;
        points?: string[];
        conclusion?: string;
        rawText: string;
    };
    onExpand: () => void;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ title, type, content, onExpand }) => {
    return (
        <div className="w-full max-w-md mx-auto">
            {/* File Header */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-dark p-4 rounded-t-[1.5rem] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <FileTextIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wide truncate max-w-[150px]">{title}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Document IA • {type}</p>
                    </div>
                </div>
                <button className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 dark:text-indigo-200 uppercase tracking-widest px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 transition-colors" onClick={onExpand}>
                    Ouvrir Studio
                </button>
            </div>

            {/* Preview Content */}
            <div className="p-6 bg-card dark:bg-card-dark border border-t-0 border-slate-100 dark:border-dark rounded-b-[1.5rem] shadow-sm dark:shadow-none relative overflow-hidden group hover:shadow-md dark:shadow-none transition-shadow cursor-pointer" onClick={onExpand}>
                {/* Subtle texture */}
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <FileTextIcon className="w-24 h-24" />
                </div>

                <div className="space-y-4 relative z-10">
                    {content.theme && (
                        <div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Thème</p>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display leading-tight">{content.theme}</h3>
                        </div>
                    )}

                    {content.scripture && (
                        <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-lg border border-slate-100 dark:border-dark">
                            <p className="text-xs font-serif italic text-slate-600 dark:text-slate-400">"{content.scripture}"</p>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                        <p className="text-[10px] text-slate-400 font-medium">Click to view full plan...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SermonStudioOverlay: React.FC<{ isOpen: boolean; onClose: () => void; content: any }> = ({ isOpen, onClose, content }) => {
    const { addSermonPlan } = useData();
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await addSermonPlan({
                title: content.theme || 'Focus sur Jésus',
                scriptureReferences: content.scripture ? [content.scripture] : [],
                content: content,
                status: 'DRAFT',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Failed to save sermon", error);
            alert("Erreur lors de l'enregistrement du sermon.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-[#0f1035]/90 "
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-4xl h-full max-h-[90vh] bg-card dark:bg-card-dark rounded-lg shadow-admin dark:shadow-none flex overflow-hidden relative"
                    >
                        {/* Close Button */}
                        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                            <XIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </button>

                        {/* Left: Editor */}
                        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-white/[0.02]">
                            {/* Toolbar */}
                            <div className="h-16 border-b border-slate-200 dark:border-dark flex items-center justify-between px-8 bg-card dark:bg-card-dark">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                        <FileTextIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                    <h2 className="font-bold text-slate-800 dark:text-white">Studio de Prédication</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-slate-50 dark:bg-white/[0.02] rounded-lg text-slate-400 hover:text-indigo-600 dark:text-indigo-300 transition-colors">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 hover:bg-slate-50 dark:bg-white/[0.02] rounded-lg text-slate-400 hover:text-indigo-600 dark:text-indigo-300 transition-colors">
                                        <ShareIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => alert("Exported to PDF")}
                                        className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        PDF
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || saved}
                                        className={`px-4 py-2 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-70`}
                                    >
                                        {isSaving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer dans BD'}
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                <div className="max-w-2xl mx-auto space-y-8">
                                    <div className="text-center pb-8 border-b border-slate-200 dark:border-dark">
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">Thème du Dimanche</p>
                                        <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white leading-tight">{content.theme || "Focus sur Jésus"}</h1>
                                    </div>

                                    {content.scripture && (
                                        <blockquote className="p-6 bg-indigo-50 dark:bg-indigo-900/20/50 rounded-lg border border-indigo-100 border-l-4 border-l-indigo-500 relative">
                                            <SparklesIcon className="absolute top-4 left-4 w-4 h-4 text-indigo-300 opacity-50" />
                                            <p className="text-lg font-serif italic text-slate-700 dark:text-white text-center leading-relaxed">"{content.scripture}"</p>
                                        </blockquote>
                                    )}

                                    <div className="space-y-6">
                                        {content.introduction && (
                                            <section>
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Introduction</h3>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light text-lg">{content.introduction}</p>
                                            </section>
                                        )}

                                        {content.points && (
                                            <section>
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Développement</h3>
                                                <ul className="space-y-4">
                                                    {content.points.map((pt: string, i: number) => (
                                                        <li key={i} className="flex gap-4">
                                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">{i + 1}</span>
                                                            <p className="text-slate-700 dark:text-white font-medium text-lg leading-relaxed pt-1">{pt}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </section>
                                        )}

                                        {content.conclusion && (
                                            <section className="bg-slate-100 p-6 rounded-lg">
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Conclusion & Appel</h3>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{content.conclusion}</p>
                                            </section>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const BriefingStudioOverlay: React.FC<{ isOpen: boolean; onClose: () => void; content: any }> = ({ isOpen, onClose, content }) => {
    const { addPastoralBriefing } = useData();
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await addPastoralBriefing({
                date: new Date().toISOString().split('T')[0],
                generatedContent: content,
                status: 'DRAFT',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Failed to save briefing", error);
            alert("Erreur lors de l'enregistrement du briefing.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-[#0f1035]/90 "
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-4xl h-full max-h-[90vh] bg-card dark:bg-card-dark rounded-lg shadow-xl flex flex-col overflow-hidden relative"
                    >
                        {/* Close Button */}
                        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                            <XIcon className="w-5 h-5 text-slate-500" />
                        </button>

                        {/* Topbar */}
                        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-card">
                            <h2 className="font-bold text-slate-800">Briefing Pastoral</h2>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || saved}
                                className={`px-4 py-2 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-70`}
                            >
                                {isSaving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
                            </button>
                        </div>

                        {/* Document Content */}
                        <div className="flex-1 overflow-y-auto p-12 bg-slate-50">
                            <div className="max-w-2xl mx-auto space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-100">
                                <h1 className="text-2xl font-black text-slate-900 border-b pb-4">Briefing Quotidien</h1>

                                <p className="text-slate-600 leading-relaxed italic">{content.overview}</p>

                                {Object.keys(content.keyMetrics || {}).length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(content.keyMetrics).map(([k, v]: [string, any], i) => (
                                            <div key={i} className="bg-indigo-50 p-4 rounded-lg">
                                                <p className="text-[10px] uppercase font-bold text-indigo-500">{k}</p>
                                                <p className="text-xl font-black text-indigo-900">{v}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest text-red-500">Tâches Urgentes</h3>
                                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                                        {(content.urgentTasks || []).map((t: string, i: number) => <li key={i}>{t}</li>)}
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest text-amber-500">Événements Imminents</h3>
                                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                                        {(content.upcomingEvents || []).map((t: string, i: number) => <li key={i}>{t}</li>)}
                                    </ul>
                                </div>

                                <div className="space-y-4 bg-purple-50 p-6 rounded-lg border border-purple-100">
                                    <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest text-purple-600">Points de Prière</h3>
                                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                                        {(content.prayerFocus || []).map((t: string, i: number) => <li key={i}>{t}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
};

export default ArtifactCard;
