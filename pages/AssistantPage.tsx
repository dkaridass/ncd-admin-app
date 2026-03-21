
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageTransition from '../components/layout/PageTransition';
import { SparklesIcon, CalendarIcon, FileTextIcon } from '../components/icons/Icons';
import { aiService } from '../services/aiService';
import { fetchBibleVerse } from '../services/bibleService';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isVerse?: boolean;
}

const AssistantPage: React.FC = () => {
  const { members, financeRecords, events, language } = useData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: language === 'ln' 
        ? "Mbote Apostle Jean-Clément. Nazali Assistant ya yo. Ndenge nini nakoki kosunga yo lelo?"
        : "Bonjour Apostle Jean-Clément. Je suis l'Intelligence Antigravité. Comment puis-je vous assister dans la vision Focus sur Jésus aujourd'hui ?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const processAiResponse = async (userPrompt: string) => {
    setIsTyping(true);
    try {
      // Check if Groq is configured
      if (!aiService.isConfigured()) {
        setMessages(prev => [...prev, {
          id: 'err-' + Date.now(),
          role: 'assistant',
          text: "GROQ_API_KEY non configurée. Veuillez la configurer dans Paramètres > Système.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
        return;
      }

      // Check if user is asking for a Bible verse
      const verseMatch = userPrompt.match(/(?:verset|verse|bible|écriture|écritures?)\s+(.+)/i);
      if (verseMatch) {
        const reference = verseMatch[1].trim();
        const verse = await fetchBibleVerse(reference);
        if (verse) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            text: `${verse.reference}\n\n"${verse.text.trim()}"`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isVerse: true
          }]);
          setIsTyping(false);
          return;
        }
      }

      // Get context for better responses
      const context = {
        language: language as 'fr' | 'ln',
        membersCount: members.length,
        recentEvents: events.slice(0, 2).map(e => e.title)
      };

      const response = await aiService.generateAssistantReply(userPrompt, context);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: 'assistant',
        text: `Connexion spirituelle interrompue (Erreur API): ${error?.message || 'Erreur inconnue'}. Veuillez vérifier votre clé d'accès.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    await processAiResponse(currentInput);
  };

  const quickActions = [
    { label: 'Briefing Pastoral', icon: CalendarIcon, prompt: "Fais-moi un briefing court sur la santé de l'église cette semaine." },
    { label: 'Plan de Sermon', icon: FileTextIcon, prompt: "Propose-moi un plan de sermon sur Focus sur Jésus." },
    { label: 'Verset du Jour', icon: SparklesIcon, prompt: "Donne-moi un verset biblique d'encouragement." },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-160px)] gap-6 md:gap-10">
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <Card className="border-none bg-primary text-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-premium dark:shadow-none relative overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-secondary opacity-80">Intelligence de Vision</h3>
            <div className="space-y-4">
              {quickActions.map((action, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(action.prompt)}
                  className="w-full flex items-center p-4 bg-card dark:bg-card-dark hover:bg-card dark:bg-card-dark rounded-2xl transition-all text-left border border-white/5 group"
                >
                  <action.icon className="w-4 h-4 text-secondary mr-4" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{action.label}</span>
                </button>
              ))}
            </div>
            {/* Indicateur Groq */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between opacity-50">
                <span className="text-[8px] font-black uppercase tracking-widest">Groq AI Active</span>
                <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse"></div>
            </div>
          </Card>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col border-none shadow-premium dark:shadow-none rounded-[2.5rem] md:rounded-[4rem] overflow-hidden bg-card dark:bg-card-dark relative border border-slate-50">
            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 scroll-smooth z-10 custom-scrollbar">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col max-w-[90%] lg:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-6 py-4 md:px-10 md:py-7 rounded-[2rem] md:rounded-[3rem] text-sm md:text-base leading-relaxed whitespace-pre-wrap ${ msg.role === 'user' ? 'bg-primary text-white rounded-tr-none font-bold' : msg.isVerse ? 'bg-indigo-50 text-primary border-2 border-indigo-100 rounded-tl-none font-serif italic text-lg md:text-xl' : 'bg-slate-50 dark:bg-white/[0.02] text-slate-800 dark:text-white border-2 border-slate-100 dark:border-dark rounded-tl-none font-medium' }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 px-2">
                        {msg.timestamp}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 dark:bg-white/[0.02] px-6 py-4 rounded-full flex gap-2 border border-slate-100 dark:border-dark">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-levitate"></div>
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-levitate [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-levitate [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 md:p-8 bg-card dark:bg-card-dark border-t border-slate-50 z-10">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-6 py-4 md:py-6 border-none rounded-full bg-slate-50 dark:bg-white/[0.02] text-primary dark:text-white font-bold placeholder-slate-300 focus:ring-8 focus:ring-primary/5 transition-all text-xs md:text-sm"
                  placeholder="Posez votre question à l'IA Antigravité..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                />
                <Button type="submit" className="rounded-full px-6 md:px-12 py-4 md:py-6 bg-primary text-white shadow-premium dark:shadow-none hover:scale-105 transition-transform" disabled={isTyping}>
                  <SparklesIcon className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default AssistantPage;
