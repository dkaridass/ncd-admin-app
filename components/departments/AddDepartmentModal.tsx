import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useData } from '../../context/DataContext';
import { Department } from '../../types';

interface AddDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddDepartmentModal: React.FC<AddDepartmentModalProps> = ({ isOpen, onClose }) => {
    const { addDepartment, departments } = useData();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [category, setCategory] = useState<Department['category']>('Spiritualité');
    const [meetingDay, setMeetingDay] = useState('');
    const [meetingDays, setMeetingDays] = useState<string[]>([]);
    const [meetingTime, setMeetingTime] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categories: Department['category'][] = ['Spiritualité', 'Culte', 'Social', 'Opérations', 'Famille', 'Formation', 'Administration', 'Technique', 'Logistique', 'Jeunesse'];
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    // Calculate next available number
    const getNextNumber = () => {
        const maxNumber = Math.max(...departments.map(d => d.number || 0), 0);
        return maxNumber + 1;
    };

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setCode('');
            setCategory('Spiritualité');
            setMeetingDay('');
            setMeetingDays([]);
            setMeetingTime('');
            setDescription('');
            setError(null);
        }
    }, [isOpen]);

    const handleDayToggle = (day: string) => {
        setMeetingDays(prev => 
            prev.includes(day) 
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!name.trim()) {
            setError('Le nom du département est requis');
            return;
        }

        setIsLoading(true);
        try {
            const newDept: Omit<Department, 'id'> = {
                number: getNextNumber(),
                name: name.trim(),
                category,
                memberCount: 0,
                reportStatus: 'À jour',
                ...(code.trim() && { code: code.trim() }),
                ...(description.trim() && { description: description.trim() }),
                ...(meetingDays.length > 0 && { meetingDays }),
                ...(meetingDay.trim() && !meetingDays.length && { meetingDay: meetingDay.trim() }),
                ...(meetingTime.trim() && { meetingTime: meetingTime.trim() })
            };

            await addDepartment(newDept as Department);
            onClose();
        } catch (error: any) {
            console.error('Error creating department:', error);
            setError(error.message || 'Erreur lors de la création du département');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Créer un Nouveau Pôle">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Nom du Département <span className="text-red-500">*</span>
                    </label>
                    <input
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700"
                        placeholder="Ex: Protocole"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Code (optionnel)</label>
                    <input
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700"
                        placeholder="Ex: PROTO"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Catégorie <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700"
                        disabled={isLoading}
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Jours de Réunion</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        {daysOfWeek.map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayToggle(day)}
                                disabled={isLoading}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                    meetingDays.includes(day)
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {day.substring(0, 3)}
                            </button>
                        ))}
                    </div>
                    {meetingDays.length === 0 && (
                        <input
                            type="text"
                            value={meetingDay}
                            onChange={e => setMeetingDay(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700"
                            placeholder="Ou saisir manuellement (ex: Samedi)"
                            disabled={isLoading}
                        />
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Heure de Réunion</label>
                    <input
                        type="text"
                        value={meetingTime}
                        onChange={e => setMeetingTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700"
                        placeholder="Ex: 17h00"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description (optionnel)</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700 resize-none"
                        placeholder="Description du département..."
                        disabled={isLoading}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Annuler
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="bg-primary text-white rounded-xl px-6"
                    >
                        {isLoading ? 'Création...' : 'Créer le Pôle'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddDepartmentModal;
