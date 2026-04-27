
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import PageTransition from '../components/layout/PageTransition';
import { PlusCircleIcon, HeartIcon, SparklesIcon } from '../components/icons/Icons';
import { aiService } from '../services/aiService';
import { PrayerRequest } from '../types';
import { showSuccess, showError } from '../utils/toast';

const PrayerRequestsPage: React.FC = () => {
    const { prayerRequests, addPrayerRequest, hasPermission } = useData();
    const [generatedPrayer, setGeneratedPrayer] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        request: '',
        submittedBy: '',
        isPrivate: false
    });

    const handleGeneratePrayer = async (requestId: string, requestText: string) => {
        if (loadingId) return;
        setLoadingId(requestId);
        try {
            const prayer = await aiService.generatePrayerForRequest(requestText);
            setGeneratedPrayer(prayer);
            setIsModalOpen(true);
            showSuccess('✅ Prière générée avec succès');
        } catch (e: any) {
            console.error("Erreur de génération IA:", e);
            showError(`Erreur lors de la génération de la prière: ${e?.message || 'Erreur inconnue'}`);
        } finally {
            setLoadingId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const newRequest: PrayerRequest = {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString('fr-FR'),
                ...formData
            };
            await addPrayerRequest(newRequest);
            setIsAddModalOpen(false);
            setFormData({ request: '', submittedBy: '', isPrivate: false });
            showSuccess('✅ Requête de prière ajoutée avec succès');
        } catch (error: any) {
            console.error("Erreur lors de l'ajout:", error);
            showError(`Erreur lors de l'ajout de la requête: ${error?.message || 'Erreur inconnue'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageTransition>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Mur d'Intercession</h2>
                    <p className="text-gray-500 text-sm">Portons ensemble les fardeaux de nos frères et sœurs</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-rose-600 hover:bg-rose-700">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Déposer une Requête
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prayerRequests.map(req => {
                    const canSeePrivate = hasPermission('VIEW_PRIVATE_PRAYERS');
                    const isActuallyPrivate = req.isPrivate && !canSeePrivate;

                    return (
                        <div key={req.id} className="bg-white rounded-lg p-6 shadow-admin border border-slate-200 flex flex-col">
                            <div className="flex items-start mb-4">
                                <div className="p-3 bg-rose-50 rounded-lg mr-4">
                                    <HeartIcon className="w-6 h-6 text-rose-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <Badge variant={req.isPrivate ? "warning" : "primary"}>
                                            {req.isPrivate ? "Confidentiel" : "Public"}
                                        </Badge>
                                        <span className="text-[10px] text-gray-400">{req.date}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{req.submittedBy}</h4>
                                </div>
                            </div>

                            <div className="flex-1 mb-6">
                                {isActuallyPrivate ? (
                                    <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200 text-center">
                                        <p className="text-xs text-slate-400 italic">Cette requête est privée. Seul le Pasteur Principal peut voir le contenu.</p>
                                    </div>
                                ) : (
                                    <p className="text-slate-800 leading-relaxed italic">"{req.request}"</p>
                                )}
                            </div>

                            {!isActuallyPrivate && (
                                <div className="pt-4 border-t border-gray-50 flex justify-end">
                                    <button
                                        onClick={() => handleGeneratePrayer(req.id, req.request)}
                                        disabled={loadingId === req.id}
                                        className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        {loadingId === req.id ? (
                                            <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-indigo-600 dark:text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <SparklesIcon className="w-3 h-3 mr-1.5" />
                                        )}
                                        {loadingId === req.id ? 'Inspiration...' : "Prier avec l'IA"}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nouvelle Requête">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Votre Nom" value={formData.submittedBy} onChange={e => setFormData({ ...formData, submittedBy: e.target.value })} required />
                    <textarea
                        className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                        rows={4}
                        required
                        value={formData.request}
                        onChange={e => setFormData({ ...formData, request: e.target.value })}
                        placeholder="Votre sujet de prière..."
                    />
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isPrivate" checked={formData.isPrivate} onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })} className="rounded text-primary dark:text-white focus:ring-primary h-4 w-4" />
                        <label htmlFor="isPrivate" className="text-sm text-slate-700 dark:text-white">Requête Confidentielle</label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Annuler</Button>
                        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>Envoyer</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Prière de l'IA">
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 italic text-slate-800 leading-relaxed font-serif">
                    {generatedPrayer}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button onClick={() => setIsModalOpen(false)}>Amen</Button>
                </div>
            </Modal>
        </PageTransition>
    );
};

export default PrayerRequestsPage;
