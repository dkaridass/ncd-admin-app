import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import PageTransition from '../components/layout/PageTransition';
import PermissionGuard from '../components/auth/PermissionGuard';
import { PlusCircleIcon, PencilIcon, TrashIcon, ArchiveIcon, FilterIcon, XCircleIcon } from '../components/icons/Icons';
import { Announcement } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const AnnouncementsPage: React.FC = () => {
    const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, archiveAnnouncement, hasPermission, currentUser, isLoading } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<Announcement['category'] | 'TOUS'>('TOUS');
    const [activeTargetFilter, setActiveTargetFilter] = useState<Announcement['target'] | 'TOUS'>('TOUS');
    const [showArchived, setShowArchived] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>>({
        title: '',
        content: '',
        category: 'Général',
        target: 'Toute l\'Assemblée',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true,
        isArchived: false,
    });

    const categories: Announcement['category'][] = ['Général', 'Jeûne & Prière', 'Finances', 'Jeunesse', 'Formation', 'Événement', 'Autre'];
    const targets: Announcement['target'][] = ['Toute l\'Assemblée', 'Départements', 'Jeunes', 'Femmes', 'Hommes', 'Leaders', 'Bénévoles'];

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(ann => {
            const matchesCategory = activeCategoryFilter === 'TOUS' || ann.category === activeCategoryFilter;
            const matchesTarget = activeTargetFilter === 'TOUS' || ann.target === activeTargetFilter;
            const matchesSearch = searchTerm === '' ||
                ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ann.content.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesArchive = showArchived ? ann.isArchived : !ann.isArchived;
            return matchesCategory && matchesTarget && matchesSearch && matchesArchive;
        });
    }, [announcements, activeCategoryFilter, activeTargetFilter, searchTerm, showArchived]);

    const activeAnnouncements = useMemo(() => {
        const now = new Date();
        return filteredAnnouncements.filter(ann => {
            if (!ann.isActive || ann.isArchived) return false;
            const startDate = new Date(ann.startDate);
            const endDate = ann.endDate ? new Date(ann.endDate) : null;
            return startDate <= now && (!endDate || endDate >= now);
        });
    }, [filteredAnnouncements]);

    const handleOpenModal = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData({
                title: announcement.title,
                content: announcement.content,
                category: announcement.category,
                target: announcement.target,
                startDate: announcement.startDate.split('T')[0],
                endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
                isActive: announcement.isActive,
                isArchived: announcement.isArchived || false,
            });
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                content: '',
                category: 'Général',
                target: 'Toute l\'Assemblée',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                isActive: true,
                isArchived: false,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAnnouncement(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const announcementData: Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'createdByName'> = {
                ...formData,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
            };

            if (editingAnnouncement) {
                await updateAnnouncement(editingAnnouncement.id, announcementData);
            } else {
                await addAnnouncement(announcementData);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error saving announcement:', error);
            alert('Erreur lors de l\'enregistrement de l\'annonce');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
            try {
                await deleteAnnouncement(id);
            } catch (error) {
                console.error('Error deleting announcement:', error);
                alert('Erreur lors de la suppression de l\'annonce');
            }
        }
    };

    const handleArchive = async (id: string) => {
        try {
            await archiveAnnouncement(id);
        } catch (error) {
            console.error('Error archiving announcement:', error);
            alert('Erreur lors de l\'archivage de l\'annonce');
        }
    };

    const getCategoryColor = (category: Announcement['category']) => {
        const colors: Record<Announcement['category'], string> = {
            'Général': 'bg-slate-500',
            'Jeûne & Prière': 'bg-purple-500',
            'Finances': 'bg-emerald-500',
            'Jeunesse': 'bg-blue-500',
            'Formation': 'bg-indigo-500',
            'Événement': 'bg-orange-500',
            'Autre': 'bg-gray-500',
        };
        return colors[category] || 'bg-gray-500';
    };

    if (isLoading) {
        return (
            <PageTransition>
                <LoadingSpinner />
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-primary font-display tracking-tight leading-none mb-1 uppercase italic">
                            Annonces
                        </h2>
                        <p className="text-slate-500 font-medium italic opacity-80 uppercase tracking-widest text-[9px]">
                            Communications • Informations • NCD La Pentecôte
                        </p>
                    </div>
                    <PermissionGuard permission="MANAGE_ANNOUNCEMENTS" fallback={null}>
                        <Button onClick={() => handleOpenModal()} className="shadow-md">
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Nouvelle Annonce
                        </Button>
                    </PermissionGuard>
                </div>

                {/* Filters */}
                <div className="mb-6 space-y-4">
                    {/* Search */}
                    <div className="flex gap-4">
                        <Input
                            placeholder="Rechercher dans les annonces..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            variant="ghost"
                            onClick={() => setShowArchived(!showArchived)}
                            className={showArchived ? 'bg-slate-100' : ''}
                        >
                            {showArchived ? 'Masquer archivées' : 'Afficher archivées'}
                        </Button>
                    </div>

                    {/* Category & Target Filters */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <FilterIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Catégorie:</span>
                        </div>
                        {['TOUS', ...categories].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategoryFilter(cat as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    activeCategoryFilter === cat
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-primary/50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <FilterIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Public:</span>
                        </div>
                        {['TOUS', ...targets].map((target) => (
                            <button
                                key={target}
                                onClick={() => setActiveTargetFilter(target as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    activeTargetFilter === target
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-primary/50'
                                }`}
                            >
                                {target}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Announcements List */}
                {filteredAnnouncements.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-slate-400 font-medium">
                            {searchTerm || activeCategoryFilter !== 'TOUS' || activeTargetFilter !== 'TOUS'
                                ? 'Aucune annonce ne correspond aux filtres'
                                : 'Aucune annonce pour le moment'}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAnnouncements.map((announcement) => {
                            const isActive = activeAnnouncements.includes(announcement);
                            return (
                                <Card key={announcement.id} className={`p-6 ${announcement.isArchived ? 'opacity-60' : ''}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <Badge className={getCategoryColor(announcement.category)}>
                                            {announcement.category}
                                        </Badge>
                                        {announcement.isArchived && (
                                            <Badge variant="default" className="bg-slate-400">
                                                Archivée
                                            </Badge>
                                        )}
                                        {isActive && !announcement.isArchived && (
                                            <Badge variant="primary" className="bg-emerald-500">
                                                Active
                                            </Badge>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{announcement.title}</h3>
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">{announcement.content}</p>

                                    <div className="space-y-2 mb-4 text-xs text-slate-500">
                                        <p><strong>Public:</strong> {announcement.target}</p>
                                        <p><strong>Début:</strong> {new Date(announcement.startDate).toLocaleDateString('fr-FR')}</p>
                                        {announcement.endDate && (
                                            <p><strong>Fin:</strong> {new Date(announcement.endDate).toLocaleDateString('fr-FR')}</p>
                                        )}
                                        <p><strong>Créée par:</strong> {announcement.createdByName || 'Inconnu'}</p>
                                    </div>

                                    <PermissionGuard permission="MANAGE_ANNOUNCEMENTS" fallback={null}>
                                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenModal(announcement)}
                                                className="flex-1"
                                            >
                                                <PencilIcon className="w-4 h-4 mr-1" />
                                                Modifier
                                            </Button>
                                            {!announcement.isArchived && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleArchive(announcement.id)}
                                                    className="flex-1"
                                                >
                                                    <ArchiveIcon className="w-4 h-4 mr-1" />
                                                    Archiver
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(announcement.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </PermissionGuard>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Create/Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingAnnouncement ? 'Modifier l\'Annonce' : 'Nouvelle Annonce'}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Titre"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="Ex: Jeûne et Prière du 15 au 17 Mars"
                        />

                        <div>
                            <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                                Contenu
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                                rows={5}
                                className="block w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-xs md:text-sm transition-all shadow-sm"
                                placeholder="Détails de l'annonce..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                                    Catégorie
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Announcement['category'] })}
                                    className="block w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-xs md:text-sm transition-all shadow-sm"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                                    Public Cible
                                </label>
                                <select
                                    value={formData.target}
                                    onChange={(e) => setFormData({ ...formData, target: e.target.value as Announcement['target'] })}
                                    className="block w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-xs md:text-sm transition-all shadow-sm"
                                >
                                    {targets.map((target) => (
                                        <option key={target} value={target}>{target}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Date de Début"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />

                            <Input
                                label="Date de Fin (optionnel)"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 text-primary border-slate-200 rounded focus:ring-primary"
                                />
                                <span className="text-sm font-bold text-slate-700">Active</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                            <Button type="button" variant="ghost" onClick={handleCloseModal}>
                                Annuler
                            </Button>
                            <Button type="submit">
                                {editingAnnouncement ? 'Enregistrer' : 'Créer'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageTransition>
    );
};

export default AnnouncementsPage;
