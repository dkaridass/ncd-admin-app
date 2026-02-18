import React, { useState } from 'react';
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
            <div className="bg-slate-50 border-b border-slate-100 p-4 rounded-t-[1.5rem] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <FileTextIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wide truncate max-w-[150px]">{title}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Document IA • {type}</p>
                    </div>
                </div>
                <button className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors" onClick={onExpand}>
                    Ouvrir Studio
                </button>
            </div>

            {/* Preview Content */}
            <div className="p-6 bg-white border border-t-0 border-slate-100 rounded-b-[1.5rem] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer" onClick={onExpand}>
                {/* Subtle texture */}
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <FileTextIcon className="w-24 h-24" />
                </div>

                <div className="space-y-4 relative z-10">
                    {content.theme && (
                        <div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Thème</p>
                            <h3 className="text-sm font-bold text-slate-800 font-display leading-tight">{content.theme}</h3>
                        </div>
                    )}

                    {content.scripture && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-serif italic text-slate-600">"{content.scripture}"</p>
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
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-[#0f1035]/90 backdrop-blur-xl"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-[2rem] shadow-2xl flex overflow-hidden relative"
                    >
                        {/* Close Button */}
                        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                            <XIcon className="w-5 h-5 text-slate-500" />
                        </button>

                        {/* Left: Editor */}
                        <div className="flex-1 flex flex-col bg-slate-50">
                            {/* Toolbar */}
                            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <FileTextIcon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h2 className="font-bold text-slate-800">Studio de Prédication</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                                        <ShareIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => alert("Exported to PDF")}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        Export PDF
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                <div className="max-w-2xl mx-auto space-y-8">
                                    <div className="text-center pb-8 border-b border-slate-200">
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">Thème du Dimanche</p>
                                        <h1 className="text-4xl font-display font-black text-slate-900 leading-tight">{content.theme || "Focus sur Jésus"}</h1>
                                    </div>

                                    {content.scripture && (
                                        <blockquote className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 border-l-4 border-l-indigo-500 relative">
                                            <SparklesIcon className="absolute top-4 left-4 w-4 h-4 text-indigo-300 opacity-50" />
                                            <p className="text-lg font-serif italic text-slate-700 text-center leading-relaxed">"{content.scripture}"</p>
                                        </blockquote>
                                    )}

                                    <div className="space-y-6">
                                        {content.introduction && (
                                            <section>
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Introduction</h3>
                                                <p className="text-slate-600 leading-relaxed font-light text-lg">{content.introduction}</p>
                                            </section>
                                        )}

                                        {content.points && (
                                            <section>
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Développement</h3>
                                                <ul className="space-y-4">
                                                    {content.points.map((pt: string, i: number) => (
                                                        <li key={i} className="flex gap-4">
                                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">{i + 1}</span>
                                                            <p className="text-slate-700 font-medium text-lg leading-relaxed pt-1">{pt}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </section>
                                        )}

                                        {content.conclusion && (
                                            <section className="bg-slate-100 p-6 rounded-2xl">
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Conclusion & Appel</h3>
                                                <p className="text-slate-600 leading-relaxed">{content.conclusion}</p>
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

export default ArtifactCard;
