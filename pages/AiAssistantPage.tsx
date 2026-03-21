import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { SparklesIcon, CalendarIcon, FileTextIcon } from '../components/icons/Icons';
import { aiService } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import ArtifactCard, { SermonStudioOverlay, BriefingStudioOverlay } from '../components/ai/ArtifactCard';
import MorningPulseCard from '../components/ai/MorningPulseCard';

const FINANCE_REFUSAL_MSG = "Vous n'avez pas les autorisations nécessaires pour consulter les informations financières. Veuillez contacter un responsable.";

/** Detect if the user message is asking for financial info (balances, totals, reports). */
function isFinancialQuestion(text: string): boolean {
    const t = text.toLowerCase().trim();
    const patterns = [
        /\b(argent|soldes?|recettes?|dépenses?|budget|finances?|comptes?|totaux?|montant|rawbank|raw\s*bank|fc\s*\d|usd|\$|cdf)\b/,
        /\bcombien\s*(d'argent|d\'argent|avons-nous|sur\s|dans\s)/i,
        /\b(rapport|résumé|bilan)\s*(financier|des\s*comptes)/i,
    ];
    return patterns.some(p => p.test(t));
}

const AiAssistantPage: React.FC = () => {
    const { currentUser, hasPermission, members, events, financeRecords, totalMembersCount } = useData();
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string | any; type?: 'text' | 'artifact' | 'pulse'; artifactType?: 'sermon' | 'briefing' }[]>([
        { role: 'assistant', content: {}, type: 'pulse' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [studioOpen, setStudioOpen] = useState(false);
    const [activeArtifact, setActiveArtifact] = useState<any>(null);
    const [activeArtifactType, setActiveArtifactType] = useState<'sermon' | 'briefing' | null>(null);
    const [isApiConfigured, setIsApiConfigured] = useState(false);
    const [activeQuickAction, setActiveQuickAction] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Check if API is configured on mount
    useEffect(() => {
        setIsApiConfigured(aiService.isConfigured());
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg, type: 'text' }]);
        setIsLoading(true);

        try {
            // Block financial answers for users without VIEW_FINANCES (e.g. VIEWER)
            if (isFinancialQuestion(userMsg) && !(hasPermission && hasPermission('VIEW_FINANCES'))) {
                setMessages(prev => [...prev, { role: 'assistant', content: FINANCE_REFUSAL_MSG, type: 'text' }]);
                setIsLoading(false);
                return;
            }

            // Check if Groq API is configured
            if (!aiService.isConfigured()) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "⚠️ GROQ_API_KEY non configurée.\n\nVeuillez configurer votre clé API Groq dans le fichier .env.local ou dans Paramètres > Système.\n\nObtenez votre clé gratuite sur: https://console.groq.com",
                    type: 'text'
                }]);
                setIsLoading(false);
                return;
            }

            // Logic for Sermon Studio detection
            if (userMsg.toLowerCase().includes('sermon') || userMsg.toLowerCase().includes('plan')) {
                // Call real Groq service for structured Sermon JSON output
                const sermonContent = await aiService.generateSermonPlan(userMsg);

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: sermonContent,
                    type: 'artifact',
                    artifactType: 'sermon'
                }]);
            } else if (userMsg.toLowerCase().includes('briefing') || userMsg.toLowerCase().includes('agenda')) {
                // Call Groq service for Pastoral Briefing
                const briefingContent = await aiService.generatePastoralBriefing({
                    membersCount: totalMembersCount,
                    recentEvents: events.slice(0, 3).map(e => e.title)
                });

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: briefingContent,
                    type: 'artifact',
                    artifactType: 'briefing'
                }]);
            } else {
                // Standard text response using generateAssistantReply
                let response = "";
                if (userMsg.toLowerCase().includes('verset')) {
                    response = await aiService.generateAssistantReply(
                        "Donne-moi un verset biblique inspirant pour aujourd'hui avec une courte méditation.",
                        { language: 'fr' }
                    );
                } else {
                    // Use generateAssistantReply for general chat
                    response = await aiService.generateAssistantReply(userMsg, { language: 'fr' });
                }
                setMessages(prev => [...prev, { role: 'assistant', content: response, type: 'text' }]);
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            const errorMessage = error?.message || 'Erreur inconnue';
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Erreur de connexion: ${errorMessage}\n\nVérifiez que votre clé API Groq est correctement configurée dans .env.local`,
                type: 'text'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickActions = [
        { label: 'Briefing Pastoral', icon: CalendarIcon, prompt: "Prépare un briefing pastoral pour la journée.", color: 'from-indigo-500/20 to-indigo-600/10', iconColor: 'text-indigo-400', borderColor: 'border-indigo-500/20 hover:border-indigo-400/40' },
        { label: 'Plan de Sermon', icon: FileTextIcon, prompt: "Suggère un plan de sermon sur...", color: 'from-violet-500/20 to-violet-600/10', iconColor: 'text-violet-400', borderColor: 'border-violet-500/20 hover:border-violet-400/40' },
        { label: 'Verset du Jour', icon: SparklesIcon, prompt: "Donne-moi un verset biblique inspirant pour aujourd'hui.", color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400', borderColor: 'border-amber-500/20 hover:border-amber-400/40' },
    ];

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-2rem)] gap-6 overflow-hidden">
            {/* Studio Modals */}
            {activeArtifactType === 'sermon' ? (
                <SermonStudioOverlay
                    isOpen={studioOpen}
                    onClose={() => setStudioOpen(false)}
                    content={activeArtifact || {}}
                />
            ) : activeArtifactType === 'briefing' ? (
                <BriefingStudioOverlay
                    isOpen={studioOpen}
                    onClose={() => setStudioOpen(false)}
                    content={activeArtifact || {}}
                />
            ) : null}

            {/* Left Panel — The Brain/Vision Module */}
            <div className="w-full md:w-[340px] rounded-[2.5rem] flex flex-col shadow-2xl dark:shadow-none relative overflow-hidden shrink-0 border border-white/[0.06]">
                {/* Immersive Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#080C18] via-[#0E1428] to-[#151B33]"></div>
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
                    <div className="absolute bottom-20 -right-20 w-64 h-64 bg-purple-600/12 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/8 rounded-full blur-[80px]"></div>
                    {/* Subtle grid texture */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col p-8">
                    {/* Module Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.6)]"></div>
                            <p className="text-[9px] font-black text-indigo-300/70 uppercase tracking-[0.3em]">Module</p>
                        </div>
                        <h2 className="text-[1.7rem] font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-indigo-200 leading-[1.15] tracking-tight">
                            INTELLIGENCE<br />DE VISION
                        </h2>
                        <div className="mt-3 h-[2px] w-12 bg-gradient-to-r from-indigo-500 to-transparent rounded-full"></div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {quickActions.map((action, i) => (
                            <motion.button
                                key={i}
                                onClick={() => { setInput(action.prompt); setActiveQuickAction(i); inputRef.current?.focus(); }}
                                whileHover={{ x: 4, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center w-full p-4 rounded-2xl bg-gradient-to-r ${action.color} border ${action.borderColor} text-white/80 hover:text-white transition-all group backdrop-blur-sm`}
                            >
                                <div className={`w-10 h-10 rounded-xl bg-white/5 backdrop-blur-sm flex items-center justify-center ${action.iconColor} group-hover:bg-white/10 transition-all mr-4 shadow-inner`}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <div className="text-left flex-1">
                                    <span className="font-bold text-xs tracking-wide block">{action.label}</span>
                                    <span className="text-[9px] text-white/30 font-medium">Cliquer pour saisir</span>
                                </div>
                                <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </motion.button>
                        ))}
                    </div>

                    {/* Status Indicator */}
                    <div className="pt-6 border-t border-white/[0.06] mt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isApiConfigured ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'} animate-pulse`}></div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">
                                    {isApiConfigured ? 'GROQ AI ACTIVE' : 'NON CONFIGURÉ'}
                                </span>
                            </div>
                        </div>
                        {!isApiConfigured && (
                            <p className="text-[8px] text-red-300/60 mt-2 font-medium">
                                Configurez VITE_GROQ_API_KEY dans .env.local
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel — Chat Interface */}
            <div className="flex-1 bg-white dark:bg-[#0A0E1A] rounded-[2.5rem] shadow-xl dark:shadow-none flex flex-col overflow-hidden relative border border-slate-100 dark:border-white/[0.06]">
                {/* Subtle Background Glow for chat area */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar relative z-10">
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 35, delay: idx === 0 ? 0.2 : 0 }}
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.type === 'pulse' ? 'w-full justify-center' : ''}`}
                            >
                                {msg.type === 'pulse' ? (
                                    <MorningPulseCard />
                                ) : msg.type === 'artifact' && msg.role === 'assistant' ? (
                                    <ArtifactCard
                                        title={msg.artifactType === 'briefing' ? "Briefing Pastoral de la journée" : msg.content.theme}
                                        type={msg.artifactType || 'sermon'}
                                        content={msg.content}
                                        onExpand={() => {
                                            setActiveArtifact(msg.content);
                                            setActiveArtifactType(msg.artifactType || 'sermon');
                                            setStudioOpen(true);
                                        }}
                                    />
                                ) : (
                                    <div className={`max-w-[78%] relative group ${msg.role === 'user' ? '' : ''}`}>
                                        <div className={`p-5 md:p-6 text-[15px] font-medium leading-[1.7] tracking-wide ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-[#1E1F54] to-[#2A2B6A] text-white rounded-[1.5rem] rounded-br-md shadow-lg shadow-indigo-900/20 border border-indigo-800/20'
                                            : 'bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-200 rounded-[1.5rem] rounded-bl-md border border-slate-100 dark:border-white/[0.06] shadow-sm dark:shadow-none'
                                            }`}>
                                            <p className="whitespace-pre-line">{msg.content as string}</p>
                                        </div>
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-2 mt-2.5 ml-2">
                                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                                                    <SparklesIcon className="w-2.5 h-2.5 text-white" />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-300 dark:text-white/20 uppercase tracking-[0.15em]">
                                                    Assistant Vision
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing Indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-slate-50 dark:bg-white/[0.03] p-5 rounded-[1.5rem] rounded-bl-md border border-slate-100 dark:border-white/[0.06] flex gap-1.5 items-center shadow-sm dark:shadow-none">
                                <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                <span className="ml-2 text-[9px] font-bold text-slate-300 dark:text-white/20 uppercase tracking-widest">Réflexion...</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Premium Input Area */}
                <div className="p-4 md:p-6 bg-white/80 dark:bg-[#0A0E1A]/80 backdrop-blur-xl border-t border-slate-100 dark:border-white/[0.04]">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.03] p-2 pr-2 pl-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] focus-within:border-indigo-400/40 focus-within:ring-4 focus-within:ring-indigo-500/[0.06] transition-all duration-300 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Posez votre question à l'IA Antigravité..."
                            className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 placeholder:font-medium h-12"
                        />
                        <motion.button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all duration-300"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <SparklesIcon className="w-5 h-5" />
                            )}
                        </motion.button>
                    </form>
                    <p className="text-center text-[9px] text-slate-300 dark:text-white/10 font-medium mt-2.5 tracking-wide">
                        Intelligence Antigravité · Propulsé par Groq AI
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiAssistantPage;
