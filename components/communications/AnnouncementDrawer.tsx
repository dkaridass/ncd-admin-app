
import React, { useState } from 'react';
import { XIcon, SparklesIcon, SendIcon } from '../icons/Icons';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { aiService } from '../../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

interface AnnouncementDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; content: string; author: string; date: string }) => void;
}

const AnnouncementDrawer: React.FC<AnnouncementDrawerProps> = ({ isOpen, onClose, onSubmit }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        author: 'Admin',
        date: new Date().toISOString().split('T')[0]
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleGenerateDraft = async () => {
        if (!formData.title) return;
        setIsGenerating(true);
        try {
            if (!aiService.isConfigured()) {
                alert('GROQ_API_KEY non configurée. Veuillez la configurer dans Paramètres > Système.');
                setIsGenerating(false);
                return;
            }
            const draft = await aiService.generateAnnouncementDraft(formData.title);
            setFormData(prev => ({ ...prev, content: draft }));
        } catch (error: any) {
            console.error("Error generating draft:", error);
            alert(`❌ Erreur lors de la génération: ${error?.message || 'Erreur inconnue'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({ title: '', content: '', author: 'Admin', date: new Date().toISOString().split('T')[0] });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto flex flex-col"
                    >
                        <div className="flex items-center justify-between p-8 border-b border-slate-100">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-slate-900">Nouvelle Annonce</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Communication Officielle</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <XIcon className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 p-8 flex flex-col gap-8">
                            <Input
                                label="Titre de l'Annonce"
                                id="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Ex: Programme de Jeûne et Prière..."
                                required
                            />

                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-end mb-3">
                                    <label htmlFor="content" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Contenu du Message
                                    </label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={handleGenerateDraft}
                                        disabled={isGenerating || !formData.title}
                                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none scale-90 origin-right"
                                    >
                                        <SparklesIcon className="w-3 h-3 mr-2" />
                                        {isGenerating ? "Rédaction..." : "Générer avec IA"}
                                    </Button>
                                </div>
                                <textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Rédigez votre annonce ici..."
                                    className="flex-1 w-full p-6 border-2 border-slate-100 rounded-2xl text-sm leading-loose text-slate-600 placeholder-slate-300 outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex gap-4">
                                <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Parent</Button>
                                <Button type="submit" className="flex-[2] shadow-xl shadow-primary/20">
                                    <SendIcon className="w-4 h-4 mr-2" />
                                    Publier Maintenant
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AnnouncementDrawer;
