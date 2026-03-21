
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import PageTransition from '../components/layout/PageTransition';
import PermissionGuard from '../components/auth/PermissionGuard';
import { FileTextIcon, PlusCircleIcon, PencilIcon, TrashIcon, FilterIcon, DownloadIcon } from '../components/icons/Icons';
import { Resource } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ResourcesPage: React.FC = () => {
    const { resources, addResource, updateResource, deleteResource, incrementResourceDownload, hasPermission, isLoading } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<Resource['category'] | 'TOUS'>('TOUS');
    const [activeTypeFilter, setActiveTypeFilter] = useState<Resource['type'] | 'TOUS'>('TOUS');
    const [searchTerm, setSearchTerm] = useState('');
    const { confirmState, confirm, cancelConfirm } = useConfirm();

    const [formData, setFormData] = useState<Omit<Resource, 'id' | 'createdAt' | 'createdBy' | 'createdByName' | 'downloadCount'>>({
        title: '',
        description: '',
        type: 'PDF',
        category: 'Formations',
        fileUrl: '',
        storagePath: '',
        isActive: true,
    });

    const categories: Resource['category'][] = ['Formations', 'Admin', 'Finances', 'Jeunesse', 'ECODIM', 'Prédications', 'Médias', 'Autre'];
    const types: Resource['type'][] = ['PDF', 'Audio', 'Vidéo', 'Image', 'Lien', 'Template', 'Document', 'Autre'];

    const filteredResources = useMemo(() => {
        return resources.filter(res => {
            if (!res.isActive) return false;
            const matchesCategory = activeCategoryFilter === 'TOUS' || res.category === activeCategoryFilter;
            const matchesType = activeTypeFilter === 'TOUS' || res.type === activeTypeFilter;
            const matchesSearch = searchTerm === '' ||
                res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                res.description?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesType && matchesSearch;
        });
    }, [resources, activeCategoryFilter, activeTypeFilter, searchTerm]);

    const getTypeColor = (type: Resource['type']) => {
        const colors: Record<Resource['type'], string> = {
            'PDF': 'bg-red-500',
            'Audio': 'bg-blue-500',
            'Vidéo': 'bg-purple-500',
            'Image': 'bg-emerald-500',
            'Lien': 'bg-indigo-500',
            'Template': 'bg-orange-500',
            'Document': 'bg-slate-500',
            'Autre': 'bg-gray-500',
        };
        return colors[type] || 'bg-gray-500';
    };

    const handleOpenModal = (resource?: Resource) => {
        if (resource) {
            setEditingResource(resource);
            setFormData({
                title: resource.title,
                description: resource.description || '',
                type: resource.type,
                category: resource.category,
                fileUrl: resource.fileUrl || '',
                storagePath: resource.storagePath || '',
                isActive: resource.isActive,
            });
        } else {
            setEditingResource(null);
            setFormData({
                title: '',
                description: '',
                type: 'PDF',
                category: 'Formations',
                fileUrl: '',
                storagePath: '',
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingResource(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingResource) {
                await updateResource(editingResource.id, formData);
            } else {
                await addResource(formData);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error saving resource:', error);
            alert('Erreur lors de l\'enregistrement de la ressource');
        }
    };

    const handleDelete = async (id: string) => {
        const accepted = await confirm({
            title: 'Supprimer cette ressource ?',
            message: 'Cette ressource sera définitivement supprimée. Cette action est irréversible.',
            confirmLabel: 'Supprimer',
            variant: 'danger',
        });
        if (accepted) {
            try {
                await deleteResource(id);
            } catch (error) {
                console.error('Error deleting resource:', error);
                alert('Erreur lors de la suppression de la ressource');
            }
        }
    };

    const handleDownload = async (resource: Resource) => {
        setDownloadingId(resource.id);
        try {
            // Track download
            await incrementResourceDownload(resource.id);

            // Open/download the file
            const url = resource.fileUrl || resource.storagePath;
            if (url) {
                if (url.startsWith('http')) {
                    window.open(url, '_blank');
                } else {
                    // If it's a Firebase Storage path, you'd need to get the download URL
                    // For now, just open the URL
                    window.open(url, '_blank');
                }
            }
        } catch (error) {
            console.error('Error downloading resource:', error);
        } finally {
            setTimeout(() => setDownloadingId(null), 1000);
        }
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
                        <h2 className="text-3xl md:text-5xl font-extrabold text-primary dark:text-white font-display tracking-tight leading-none mb-1 uppercase italic">
                            Ressources
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic opacity-80 uppercase tracking-widest text-[9px]">
                            Documents • Médias • Formations • NCD La Pentecôte
                        </p>
                    </div>
                    <PermissionGuard permission="MANAGE_RESOURCES" fallback={null}>
                        <Button onClick={() => handleOpenModal()} className="shadow-md dark:shadow-none">
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Ajouter Ressource
                        </Button>
                    </PermissionGuard>
                </div>

                {/* Filters */}
                <div className="mb-6 space-y-4">
                    {/* Search */}
                    <Input
                        placeholder="Rechercher dans les ressources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-4"
                    />

                    {/* Category & Type Filters */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <FilterIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Catégorie:</span>
                        </div>
                        {['TOUS', ...categories].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategoryFilter(cat as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCategoryFilter === cat ? 'bg-primary text-white shadow-md dark:shadow-none' : 'bg-card dark:bg-card-dark border-2 border-slate-200 dark:border-dark text-slate-700 dark:text-white hover:border-primary/50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <FilterIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Type:</span>
                        </div>
                        {['TOUS', ...types].map((type) => (
                            <button
                                key={type}
                                onClick={() => setActiveTypeFilter(type as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTypeFilter === type ? 'bg-primary text-white shadow-md dark:shadow-none' : 'bg-card dark:bg-card-dark border-2 border-slate-200 dark:border-dark text-slate-700 dark:text-white hover:border-primary/50'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resources List */}
                {filteredResources.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-slate-400 font-medium">
                            {searchTerm || activeCategoryFilter !== 'TOUS' || activeTypeFilter !== 'TOUS'
                                ? 'Aucune ressource ne correspond aux filtres'
                                : 'Aucune ressource pour le moment'}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map((resource) => (
                            <Card key={resource.id} className="p-6 hover:shadow-lg dark:shadow-none transition-all duration-300 group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                        <FileTextIcon className="w-8 h-8 text-primary dark:text-white group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <Badge className={getTypeColor(resource.type)}>
                                        {resource.type}
                                    </Badge>
                                </div>

                                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2">{resource.title}</h4>
                                {resource.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{resource.description}</p>
                                )}

                                <div className="space-y-2 mb-4 text-xs text-slate-500 dark:text-slate-400">
                                    <p><strong>Catégorie:</strong> {resource.category}</p>
                                    <p><strong>Ajouté le:</strong> {new Date(resource.createdAt).toLocaleDateString('fr-FR')}</p>
                                    {resource.createdByName && (
                                        <p><strong>Par:</strong> {resource.createdByName}</p>
                                    )}
                                    {resource.downloadCount !== undefined && resource.downloadCount > 0 && (
                                        <p><strong>Téléchargements:</strong> {resource.downloadCount}</p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-dark">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownload(resource)}
                                        disabled={downloadingId === resource.id}
                                        className="flex-1"
                                    >
                                        {downloadingId === resource.id ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Ouverture...
                                            </span>
                                        ) : (
                                            <>
                                                <DownloadIcon className="w-4 h-4 mr-1" />
                                                Télécharger
                                            </>
                                        )}
                                    </Button>
                                    <PermissionGuard permission="MANAGE_RESOURCES" fallback={null}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleOpenModal(resource)}
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(resource.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </PermissionGuard>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Create/Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingResource ? 'Modifier la Ressource' : 'Nouvelle Ressource'}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Titre"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="Ex: Notes du culte du 22 Octobre"
                        />

                        <div>
                            <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                                Description (optionnel)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="block w-full px-4 py-3 border-2 border-slate-100 dark:border-dark rounded-xl bg-card dark:bg-card-dark text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-xs md:text-sm transition-all shadow-sm dark:shadow-none"
                                placeholder="Description de la ressource..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource['type'] })}
                                    className="block w-full px-4 py-3 border-2 border-slate-100 dark:border-dark rounded-xl bg-card dark:bg-card-dark text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-xs md:text-sm transition-all shadow-sm dark:shadow-none"
                                >
                                    {types.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                                    Catégorie
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Resource['category'] })}
                                    className="block w-full px-4 py-3 border-2 border-slate-100 dark:border-dark rounded-xl bg-card dark:bg-card-dark text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-xs md:text-sm transition-all shadow-sm dark:shadow-none"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Input
                            label="URL du Fichier (ou Lien)"
                            value={formData.fileUrl}
                            onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                            required
                            placeholder="https://..."
                        />

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 text-primary dark:text-white border-slate-200 dark:border-dark rounded focus:ring-primary"
                                />
                                <span className="text-sm font-bold text-slate-700 dark:text-white">Active</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100 dark:border-dark">
                            <Button type="button" variant="ghost" onClick={handleCloseModal}>
                                Annuler
                            </Button>
                            <Button type="submit">
                                {editingResource ? 'Enregistrer' : 'Créer'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
            <ConfirmDialog {...confirmState} onCancel={cancelConfirm} />
        </PageTransition>
    );
};

export default ResourcesPage;
