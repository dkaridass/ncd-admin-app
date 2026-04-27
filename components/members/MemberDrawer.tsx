import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { Member, PersonStatus, FollowUpStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { showSuccess, showError } from '../../utils/toast';

interface MemberDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    member: Partial<Member> | null;
    onSave: (data: Partial<Member>) => void;
    onDelete?: (id: string) => Promise<void>;
    isEditing: boolean;
}

const MemberDrawer: React.FC<MemberDrawerProps> = ({ isOpen, onClose, member, onSave, onDelete, isEditing }) => {
    const { departments } = useData();
    const { confirmState, confirm, cancelConfirm } = useConfirm();
    const settings = {
        initial: { x: '100%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '100%', opacity: 0 },
        transition: { type: 'spring', damping: 25, stiffness: 200 }
    };

    const [formData, setFormData] = useState<Partial<Member>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (member) {
                setFormData(member);
            } else {
                setFormData({});
            }
            setErrors({}); // Clear errors when drawer opens
        }
    }, [member, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target as HTMLInputElement;

        // Clear error for this field when user starts typing
        if (errors[id]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [id]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name || !formData.name.trim()) {
            newErrors.name = 'Le nom est requis';
        }

        if (!formData.phone || !formData.phone.trim()) {
            newErrors.phone = 'Le téléphone est requis';
        }

        if (!formData.email || !formData.email.trim()) {
            newErrors.email = 'L\'email est requis';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                newErrors.email = 'Format d\'email invalide';
            }
        }

        if (!formData.family || !formData.family.trim()) {
            newErrors.family = 'Le nom de famille est requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            showError('Veuillez corriger les erreurs dans le formulaire');
            return;
        }

        setIsSubmitting(true);

        try {
            // Ensure required fields are set
            const memberData: Partial<Member> = {
                ...formData,
                name: formData.name!.trim(),
                phone: formData.phone!.trim(),
                email: formData.email!.trim(),
                family: formData.family!.trim(),
                role: formData.role || 'Fidèle',
                status: formData.status || 'Fidèle',
                gender: formData.gender || 'Homme',
                joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
                avatarUrl: formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name!)}&background=1E1B4B&color=fff`
            };

            // Ensure departmentIds is never undefined - convert to empty array if needed
            if (memberData.departmentIds === undefined || memberData.departmentIds === null) {
                memberData.departmentIds = [];
            }

            // Remove any other undefined values
            Object.keys(memberData).forEach(key => {
                if ((memberData as any)[key] === undefined) {
                    delete (memberData as any)[key];
                }
            });

            await onSave(memberData);
            // Success toast and drawer close will be handled by parent component
        } catch (error: any) {
            showError(`Erreur lors de l'enregistrement: ${error.message || 'Erreur inconnue'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/20  z-40"
                        />

                        {/* Drawer */}
                        <motion.div
                            {...settings}
                            className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-card dark:bg-card-dark shadow-admin dark:shadow-none z-50 overflow-y-auto border-l border-slate-100 dark:border-dark flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-dark flex justify-between items-center bg-card dark:bg-card-dark sticky top-0  z-10">
                                <div>
                                    <h2 className="text-xl font-display font-black text-primary dark:text-white uppercase italic tracking-tight">
                                        {isEditing ? `Dossier: ${formData.name}` : 'Nouveau Profil'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fiche d'identification NCD</p>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/[0.02] text-slate-400 hover:bg-slate-100 flex items-center justify-center font-bold text-lg">&times;</button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit} className="flex-1 p-8 space-y-10">
                                {/* Identity Section */}
                                <section className="space-y-6">
                                    <h4 className="flex items-center text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span> Identité
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <Input
                                                label="Nom Complet"
                                                id="name"
                                                value={formData.name || ''}
                                                onChange={handleInputChange}
                                                required
                                                className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
                                            />
                                            {errors.name && (
                                                <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Genre</label>
                                            <select id="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-5 py-3 rounded-lg border border-slate-200 dark:border-dark bg-card dark:bg-card-dark font-bold text-xs text-primary dark:text-white focus:border-primary/20 outline-none">
                                                <option value="Homme">Homme</option>
                                                <option value="Femme">Femme</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <Input label="Date de Naissance" id="birthDate" type="date" value={formData.birthDate || ''} onChange={handleInputChange} />
                                        <Input label="État Civil" id="civilState" value={formData.civilState || ''} onChange={handleInputChange} placeholder="Marié(e)" />
                                    </div>
                                </section>

                                {/* Contact Section */}
                                <section className="space-y-6">
                                    <h4 className="flex items-center text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2"></span> Contact & Adresse
                                    </h4>
                                    <div>
                                        <Input
                                            label="Téléphone"
                                            id="phone"
                                            type="tel"
                                            value={formData.phone || ''}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="+243..."
                                            className={errors.phone ? 'border-red-500 focus:border-red-500' : ''}
                                        />
                                        {errors.phone && (
                                            <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.phone}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Input
                                            label="Email"
                                            id="email"
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="email@example.com"
                                            className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.email}</p>
                                        )}
                                    </div>
                                    <Input label="WhatsApp (Optionnel)" id="whatsapp" type="tel" value={formData.whatsapp || ''} onChange={handleInputChange} placeholder="+243..." />
                                    <Input label="Adresse / Quartier" id="commune" value={formData.commune || ''} onChange={handleInputChange} placeholder="Quartier, Commune" />
                                    <div>
                                        <Input
                                            label="Famille"
                                            id="family"
                                            value={formData.family || ''}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Nom de famille"
                                            className={errors.family ? 'border-red-500 focus:border-red-500' : ''}
                                        />
                                        {errors.family && (
                                            <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.family}</p>
                                        )}
                                    </div>
                                </section>

                                {/* Spiritual Section */}
                                <section className="space-y-6 bg-slate-50 dark:bg-white/[0.02] p-6 rounded-lg border border-slate-100 dark:border-dark">
                                    <h4 className="flex items-center text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"></span> Vie Spirituelle & Service
                                    </h4>
                                    <div className="flex items-center justify-between bg-card dark:bg-card-dark p-4 rounded-lg border border-slate-100 dark:border-dark">
                                        <label htmlFor="isBaptised" className="text-xs font-bold text-primary dark:text-white">Baptisé par Immersion</label>
                                        <input
                                            type="checkbox"
                                            id="isBaptised"
                                            checked={formData.isBaptised || false}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-primary dark:text-white border-slate-300 rounded focus:ring-primary"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Statut Membre</label>
                                            <select id="status" value={formData.status} onChange={handleInputChange} className="w-full px-5 py-3 rounded-lg border border-slate-200 dark:border-dark bg-card dark:bg-card-dark font-bold text-xs text-primary dark:text-white focus:border-primary/20 outline-none">
                                                <option value="Fidèle">Fidèle</option>
                                                <option value="Visiteur">Visiteur</option>
                                                <option value="Archivé">Archivé</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Qualité / Titre</label>
                                            <select id="role" value={formData.role} onChange={handleInputChange} className="w-full px-5 py-3 rounded-lg border border-slate-200 dark:border-dark bg-card dark:bg-card-dark font-bold text-xs text-primary dark:text-white focus:border-primary/20 outline-none">
                                                <option value="Fidèle">Fidèle</option>
                                                <option value="Frère">Frère</option>
                                                <option value="Sœur">Sœur</option>
                                                <option value="Berger">Berger</option>
                                                <option value="Bergère">Bergère</option>
                                                <option value="Pasteur">Pasteur</option>
                                                <option value="Pasteure">Pasteure</option>
                                                <option value="Vice-président">Vice-président</option>
                                                <option value="Admin">Admin</option>
                                                <option value="Admin adjoint">Admin adjoint</option>
                                                <option value="Secrétaire">Secrétaire</option>
                                                <option value="Serviteur">Serviteur</option>
                                                <option value="Diacre">Diacre</option>
                                                <option value="Ancien">Ancien</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Church Function (Fonction) */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Fonction dans l'Église</label>
                                        <select
                                            id="churchFunction"
                                            value={formData.churchFunction || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3 rounded-lg border border-slate-200 dark:border-dark bg-card dark:bg-card-dark font-bold text-xs text-primary dark:text-white focus:border-primary/20 outline-none"
                                        >
                                            <option value="">Aucune fonction</option>
                                            <option value="Pasteur principal">Pasteur principal</option>
                                            <option value="Pasteur résident">Pasteur résident</option>
                                            <option value="Pasteur résident adjoint">Pasteur résident adjoint</option>
                                            <option value="Pasteur">Pasteur</option>
                                            <option value="Berger">Berger</option>
                                            <option value="Administrateur principal">Administrateur principal</option>
                                            <option value="Administrateur adjoint">Administrateur adjoint</option>
                                            <option value="Administrateur">Administrateur</option>
                                            <option value="Président de département">Président de département</option>
                                            <option value="Vice président de département">Vice président de département</option>
                                            <option value="Serviteur">Serviteur</option>
                                        </select>
                                        <p className="text-[9px] text-slate-400 mt-1 italic">Fonction administrative dans l'église</p>
                                    </div>

                                    {/* Departments Selection */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Département Principal</label>
                                        <select
                                            id="primaryDepartmentId"
                                            value={formData.primaryDepartmentId || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3 rounded-lg border border-slate-200 dark:border-dark bg-card dark:bg-card-dark font-bold text-xs text-primary dark:text-white focus:border-primary/20 outline-none"
                                        >
                                            <option value="">Aucun département</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Leadership Toggle */}
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20/50 rounded-lg border border-indigo-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="isLeader" className="text-xs font-bold text-indigo-900 dark:text-white">Responsabilité / Leadership</label>
                                            <input
                                                type="checkbox"
                                                id="isLeader"
                                                checked={formData.isLeader || false}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 text-indigo-600 dark:text-indigo-300 border-indigo-200 rounded focus:ring-indigo-500"
                                            />
                                        </div>

                                        {formData.isLeader && (
                                            <div className="animate-fade-in space-y-3">
                                                <div>
                                                    <label className="block text-[9px] font-black text-indigo-400 mb-1.5 uppercase tracking-widest">Niveau</label>
                                                    <select id="leadershipLevel" value={formData.leadershipLevel || ''} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-indigo-200 bg-card dark:bg-card-dark text-xs font-bold text-indigo-900 dark:text-white focus:ring-2 focus:ring-indigo-100 outline-none">
                                                        <option value="">Sélectionner...</option>
                                                        <option value="Pasteur">Pasteur / Titulaire</option>
                                                        <option value="Président">Président</option>
                                                        <option value="VP">Vice-Président</option>
                                                        <option value="2ème VP">2ème Vice-Président</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black text-indigo-400 mb-1.5 uppercase tracking-widest">Détails (ex: ECODIM, ACCUEIL)</label>
                                                    <Input
                                                        id="responsibilities-input"
                                                        placeholder="Séparez par des virgules..."
                                                        value={formData.responsibilities?.join(', ') || ''}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            responsibilities: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                        }))}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Volunteer Section */}
                                    <div className="p-4 bg-green-50/50 rounded-lg border border-green-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="isVolunteer" className="text-xs font-bold text-green-900">Bénévole</label>
                                            <input
                                                type="checkbox"
                                                id="isVolunteer"
                                                checked={formData.isVolunteer || false}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 text-green-600 border-green-200 rounded focus:ring-green-500"
                                            />
                                        </div>

                                        {formData.isVolunteer && (
                                            <div className="animate-fade-in space-y-3">
                                                <div>
                                                    <label className="block text-[9px] font-black text-green-400 mb-1.5 uppercase tracking-widest">Département de Bénévolat</label>
                                                    <select
                                                        id="volunteerDepartmentId"
                                                        value={formData.volunteerDepartmentId || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 rounded-lg border border-green-200 bg-card dark:bg-card-dark text-xs font-bold text-green-900 focus:ring-2 focus:ring-green-100 outline-none"
                                                    >
                                                        <option value="">Sélectionner un département...</option>
                                                        {departments.map(dept => (
                                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black text-green-400 mb-1.5 uppercase tracking-widest">Rôles de Bénévolat</label>
                                                    <Input
                                                        id="volunteerRoles-input"
                                                        placeholder="Ex: Accueil, Sécurité, Son, Multimédia (séparez par des virgules)"
                                                        value={formData.volunteerRoles?.join(', ') || ''}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            volunteerRoles: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                        }))}
                                                    />
                                                    <p className="text-[9px] text-green-400 mt-1 italic">Rôles ou domaines de service</p>
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black text-green-400 mb-1.5 uppercase tracking-widest">Statut du Bénévole</label>
                                                    <select
                                                        id="volunteerStatus"
                                                        value={formData.volunteerStatus || 'Actif'}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2 rounded-lg border border-green-200 bg-card dark:bg-card-dark text-xs font-bold text-green-900 focus:ring-2 focus:ring-green-100 outline-none"
                                                    >
                                                        <option value="Actif">Actif</option>
                                                        <option value="Inactif">Inactif</option>
                                                        <option value="En pause">En pause</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black text-green-400 mb-1.5 uppercase tracking-widest">Date de Début (Bénévolat)</label>
                                                    <Input
                                                        id="volunteerStartDate"
                                                        type="date"
                                                        value={formData.volunteerStartDate || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Footer Actions */}
                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-10 border-t border-slate-50 mt-auto bg-card dark:bg-card-dark sticky bottom-0 pb-4">
                                    {isEditing && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={async (e) => {
                                                e.preventDefault(); // Just in case
                                                console.log("🗑️ CLICKED DELETE BUTTON");
                                                console.log("   - Member ID:", formData.id);
                                                console.log("   - onDelete prop exists?", !!onDelete);

                                                if (!formData.id) {
                                                    console.error("❌ ERROR: No member ID to delete");
                                                    alert("Erreur: ID membre manquant");
                                                    return;
                                                }

                                                if (!onDelete) {
                                                    console.error("❌ ERROR: onDelete function is missing");
                                                    alert("Erreur: Fonction de suppression manquante");
                                                    return;
                                                }

                                                const accepted = await confirm({
                                                    title: 'Supprimer ce membre ?',
                                                    message: 'Êtes-vous sûr de vouloir supprimer ce profil ? Cette action est irréversible et toutes les données associées seront perdues.',
                                                    confirmLabel: 'Supprimer définitivement',
                                                    variant: 'danger',
                                                });
                                                if (accepted) {
                                                    console.log("✅ Confirmation accepted. Calling onDelete...");
                                                    try {
                                                        await onDelete(formData.id);
                                                        console.log("🎉 Delete finished successfully. Closing drawer...");
                                                        showSuccess('✅ Membre supprimé avec succès');
                                                        onClose();
                                                    } catch (error) {
                                                        console.error("❌ Delete failed in UI:", error);
                                                        showError(`Échec de la suppression: ${(error as Error).message}`);
                                                    }
                                                }
                                            }}
                                            className="text-red-500 hover:bg-red-50 dark:bg-red-900/20"
                                        >
                                            Supprimer le Membre
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        isLoading={isSubmitting}
                                        disabled={isSubmitting}
                                        className="px-10 py-4 bg-primary text-white rounded-lg shadow-admin uppercase font-black tracking-widest text-xs transition-colors"
                                    >
                                        Enregistrer le Profil
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <ConfirmDialog {...confirmState} onCancel={cancelConfirm} />
        </>,
        document.body
    );
};

export default MemberDrawer;
