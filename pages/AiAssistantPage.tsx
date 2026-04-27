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
        { label: 'Briefing Pastoral', icon: CalendarIcon, prompt: "Prépare un briefing pastoral pour la journée.", color: 'bg-slate-50', iconColor: 'text-indigo-600', borderColor: 'border-slate-200 hover:border-indigo-400' },
        { label: 'Plan de Sermon', icon: FileTextIcon, prompt: "Suggère un plan de sermon sur...", color: 'bg-slate-50', iconColor: 'text-violet-600', borderColor: 'border-slate-200 hover:border-violet-400' },
        { label: 'Verset du Jour', icon: SparklesIcon, prompt: "Donne-moi un verset biblique inspirant pour aujourd'hui.", color: 'bg-slate-50', iconColor: 'text-amber-600', borderColor: 'border-slate-200 hover:border-amber-400' },
    ];

    return (
        <div className="flex flex-col md:flex-row h-[calc(100dvh-8rem)] md:h-[calc(100vh-6rem)] gap-4 md:gap-6 overflow-hidden pb-4 md:pb-0">
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
            <div className="w-full md:w-[340px] rounded-lg bg-white flex flex-col shadow-admin relative overflow-hidden border border-border shrink-0 h-[220px] md:h-auto">
                <div className="relative z-10 flex-1 flex flex-col p-4 md:p-8">
                    {/* Module Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.6)]"></div>
                            <p className="text-[9px] font-black text-indigo-300/70 uppercase tracking-[0.3em]">Module</p>
                        </div>
                        <h2 className="text-[1.7rem] font-display font-black text-slate-800 leading-[1.15] tracking-tight">
                            INTELLIGENCE<br />DE VISION
                        </h2>
                        <div className="mt-3 h-[2px] w-12 bg-indigo-500 rounded-full"></div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {quickActions.map((action, i) => (
                            <motion.button
                                key={i}
                                onClick={() => { setInput(action.prompt); setActiveQuickAction(i); inputRef.current?.focus(); }}
                                whileHover={{ x: 4, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center w-full p-4 rounded-lg flex-col items-start ${action.color} border ${action.borderColor} text-slate-700 hover:text-slate-900 transition-all group`}
                            >
                                <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${action.iconColor} group-hover:bg-slate-100 transition-all shadow-sm mb-3`}>
                                    <action.icon className="w-4 h-4" />
                                </div>
                                <div className="text-left w-full">
                                    <span className="font-bold text-xs tracking-wide block">{action.label}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Cliquer pour saisir</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Status Indicator */}
                    <div className="pt-6 border-t border-white/[0.06] mt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isApiConfigured ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'} animate-pulse`}></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                    {isApiConfigured ? 'GROQ AI ACTIVE' : 'NON CONFIGURÉ'}
                                </span>
                            </div>
                        </div>
                        {!isApiConfigured && (
                            <p className="text-[9px] text-red-500 mt-2 font-medium">
                                Configurez VITE_GROQ_API_KEY dans .env.local
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel — Chat Interface */}
            <div className="flex-1 bg-white rounded-lg shadow-admin flex flex-col overflow-hidden relative border border-border">
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
                                        <div className={`p-4 md:p-5 text-[14px] font-medium leading-[1.6] tracking-wide ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-lg rounded-br-none border border-primary/20'
                                            : 'bg-slate-50 text-slate-800 rounded-lg rounded-bl-none border border-slate-200'
                                            }`}>
                                            <p className="whitespace-pre-line">{msg.content as string}</p>
                                        </div>
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-2 mt-2.5 ml-2">
                                                <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                                    <SparklesIcon className="w-2.5 h-2.5 text-white" />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
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
                            <div className="bg-slate-50 p-4 rounded-lg rounded-bl-none border border-slate-200 flex gap-1.5 items-center">
                                <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                <span className="ml-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Réflexion...</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 md:p-6 bg-white border-t border-slate-100">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-3 bg-white p-2 pr-2 pl-4 rounded-lg border border-slate-200 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-300"
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
                            className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-all duration-300"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <SparklesIcon className="w-5 h-5" />
                            )}
                        </motion.button>
                    </form>
                    <p className="text-center text-[9px] text-slate-400 font-medium mt-3 tracking-wide">
                        Intelligence Antigravité · Propulsé par Groq AI
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiAssistantPage;
