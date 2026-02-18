import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { MessageTemplate, MessageType } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { PlusIcon, TrashIcon, EditIcon } from '../icons/Icons';

const TemplatesTab: React.FC = () => {
    const { templates, addTemplate, deleteTemplate, currentUser } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    const [formData, setFormData] = useState<Partial<MessageTemplate>>({
        name: '',
        category: 'OTHER',
        content: '',
        type: 'BOTH',
        subject: ''
    });

    const openModal = (template?: MessageTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData(template);
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                category: 'OTHER',
                content: '',
                type: 'BOTH',
                subject: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.content) return;

        try {
            if (editingTemplate) {
                // Update logic (if implemented in DataContext, but currently only add/delete)
                // For now, let's delete and re-add or just add new
                // Since updateTemplate is missing, we might need to implement it or just mock it by delete/add
                // Let's just add new for now as per "Implement 'Modèles'"
                await deleteTemplate(editingTemplate.id);
            }

            const newTemplate: MessageTemplate = {
                id: editingTemplate ? editingTemplate.id : Date.now().toString(),
                name: formData.name!,
                category: formData.category as any || 'OTHER',
                content: formData.content!,
                type: formData.type as MessageType || 'BOTH',
                subject: formData.subject,
                createdBy: currentUser?.id || 'unknown',
                createdAt: new Date().toISOString(),
                usageCount: editingTemplate?.usageCount || 0
            };

            await addTemplate(newTemplate);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Erreur lors de l'enregistrement du modèle");
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Supprimer ce modèle ?')) {
            await deleteTemplate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Modèles de Messages</h3>
                    <p className="text-slate-500 text-sm">Créez des modèles pour vos communications récurrentes.</p>
                </div>
                <Button onClick={() => openModal()}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Nouveau Modèle
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-slate-400 font-medium">Aucun modèle créé</p>
                    </div>
                ) : (
                    templates.map(template => (
                        <Card key={template.id} className="relative group hover:shadow-lg transition-all border-l-4 border-l-primary/20">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(template)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => handleDelete(template.id, e)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex gap-2 mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                    {template.category}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-500 px-2 py-1 rounded">
                                    {template.type}
                                </span>
                            </div>

                            <h4 className="text-lg font-bold text-slate-800 mb-2">{template.name}</h4>

                            {template.subject && (
                                <p className="text-xs font-bold text-slate-500 mb-2">Sujet: {template.subject}</p>
                            )}

                            <p className="text-sm text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-lg font-mono text-xs">
                                {template.content}
                            </p>
                        </Card>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTemplate ? "Modifier le Modèle" : "Nouveau Modèle"}
            >
                <div className="space-y-4">
                    <Input
                        label="Nom du Modèle"
                        value={formData.name || ''}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Message de Bienvenue"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Catégorie</label>
                            <select
                                className="w-full p-3 border rounded-xl bg-white text-sm"
                                value={formData.category}
                                onChange={e => setFormData(p => ({ ...p, category: e.target.value as any }))}
                            >
                                <option value="WELCOME">Bienvenue</option>
                                <option value="EVENT">Événement</option>
                                <option value="PRAYER">Prière</option>
                                <option value="ANNOUNCEMENT">Annonce</option>
                                <option value="OTHER">Autre</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                            <select
                                className="w-full p-3 border rounded-xl bg-white text-sm"
                                value={formData.type}
                                onChange={e => setFormData(p => ({ ...p, type: e.target.value as any }))}
                            >
                                <option value="SMS">SMS</option>
                                <option value="EMAIL">Email</option>
                                <option value="BOTH">Les Deux</option>
                            </select>
                        </div>
                    </div>

                    {formData.type !== 'SMS' && (
                        <Input
                            label="Sujet (Email)"
                            value={formData.subject || ''}
                            onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                            placeholder="Sujet du message..."
                        />
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Contenu</label>
                        <textarea
                            className="w-full p-3 border rounded-xl h-32 text-sm"
                            value={formData.content || ''}
                            onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                            placeholder="Bonjour {nom}, ..."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Vous pouvez utiliser {'{nom}'} pour personnaliser le message.</p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSubmit}>Enregistrer</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TemplatesTab;
