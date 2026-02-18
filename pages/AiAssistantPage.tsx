import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { SparklesIcon, SendIcon, CalendarIcon, FileTextIcon, MenuIcon } from '../components/icons/Icons';
import Button from '../components/ui/Button';
import { aiService } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import ArtifactCard, { SermonStudioOverlay } from '../components/ai/ArtifactCard';
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
    const { currentUser, hasPermission } = useData();
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string | any; type?: 'text' | 'artifact' | 'pulse' }[]>([
        { role: 'assistant', content: {}, type: 'pulse' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [studioOpen, setStudioOpen] = useState(false);
    const [activeArtifact, setActiveArtifact] = useState<any>(null);
    const [isApiConfigured, setIsApiConfigured] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
                await new Promise(r => setTimeout(r, 2000)); // Simulate AI thinking time

                const sermonContent = {
                    theme: "La Puissance de la Résurrection",
                    scripture: "Philippiens 3:10",
                    introduction: "Nous vivons souvent comme si la résurrection était un événement historique, alors qu'elle est une puissance active aujourd'hui.",
                    points: [
                        "La connaissance intime de Christ (Ginosko)",
                        "La communion à ses souffrances : une voie vers la gloire",
                        "L'espérance qui ne trompe point"
                    ],
                    conclusion: "Ne vous contentez pas d'une religion morte. Embrassez la vie de résurrection dès ce matin.",
                    rawText: "Full plan..."
                };

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: sermonContent,
                    type: 'artifact'
                }]);
            } else {
                // Standard text response using generateAssistantReply
                let response = "";
                if (userMsg.toLowerCase().includes('briefing') || userMsg.toLowerCase().includes('agenda')) {
                    response = await aiService.generateAssistantReply(
                        "Prépare un briefing pastoral pour la journée avec les priorités et événements à venir.",
                        { language: 'fr' }
                    );
                } else if (userMsg.toLowerCase().includes('verset')) {
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

    const QuickAction = ({ icon: Icon, label, prompt }: { icon: any, label: string, prompt: string }) => (
        <button
            onClick={() => { setInput(prompt); }}
            className="flex items-center w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-indigo-100 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all group mb-3"
        >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500/30 group-hover:text-white transition-colors mr-4">
                <Icon className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-2rem)] gap-6 overflow-hidden">
            {/* Sermon Studio Modal */}
            <SermonStudioOverlay
                isOpen={studioOpen}
                onClose={() => setStudioOpen(false)}
                content={activeArtifact || {}}
            />

            {/* Left Panel - The Brain (Living Aura Mode) */}
            <div className="w-full md:w-[320px] bg-[#0f1035] rounded-[2.5rem] p-8 flex flex-col shadow-2xl relative overflow-hidden shrink-0 border border-white/5">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -left-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-0 right-0 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px]"></div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col">
                    <div className="mb-10">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Module</p>
                        <h2 className="text-2xl font-display font-bold text-white leading-tight">INTELLIGENCE<br />DE VISION</h2>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                        <QuickAction icon={CalendarIcon} label="Briefing Pastoral" prompt="Prépare un briefing pastoral pour la journée." />
                        <QuickAction icon={FileTextIcon} label="Plan de Sermon" prompt="Suggère un plan de sermon sur..." />
                        <QuickAction icon={SparklesIcon} label="Verset du Jour" prompt="Donne-moi un verset biblique inspirant pour aujourd'hui." />
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                {isApiConfigured ? 'GROQ AI ACTIVE' : 'GROQ AI NON CONFIGURÉ'}
                            </span>
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse ${
                                isApiConfigured ? 'bg-emerald-400' : 'bg-red-400'
                            }`}></div>
                        </div>
                        {!isApiConfigured && (
                            <p className="text-[8px] text-red-300 mt-2">
                                Configurez VITE_GROQ_API_KEY dans .env.local
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel - Chat Interface */}
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-premium flex flex-col overflow-hidden relative border border-slate-100/50">
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.type === 'pulse' ? 'w-full justify-center' : ''}`}
                        >
                            {msg.type === 'pulse' ? (
                                <MorningPulseCard />
                            ) : msg.type === 'artifact' && msg.role === 'assistant' ? (
                                <ArtifactCard
                                    title={msg.content.theme}
                                    type="sermon"
                                    content={msg.content}
                                    onExpand={() => { setActiveArtifact(msg.content); setStudioOpen(true); }}
                                />
                            ) : (
                                <div className={`max-w-[75%] p-7 rounded-[2.5rem] text-[15px] font-medium leading-relaxed shadow-lg backdrop-blur-sm ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-[#1a1b4b] to-[#2d2e6a] text-white rounded-br-none border border-indigo-900/10'
                                    : 'bg-white/90 text-slate-700 rounded-bl-none border border-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]'
                                    }`}>
                                    <p className="whitespace-pre-line tracking-wide">{msg.content as string}</p>
                                    {msg.role === 'assistant' && (
                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100/50">
                                            <SparklesIcon className="w-3 h-3 text-indigo-300" />
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                                Assistant Vision
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-50 p-6 rounded-[2rem] rounded-bl-none border border-slate-100 flex gap-2 items-center">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-slate-50">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-4 bg-slate-50 p-2 pr-2 pl-6 rounded-[2rem] border border-slate-100 focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Posez votre question à l'IA Antigravité..."
                            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium h-12"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <SparklesIcon className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiAssistantPage;
