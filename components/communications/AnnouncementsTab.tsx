import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Announcement } from '../../types';
import AnnouncementDrawer from './AnnouncementDrawer';
import AnnouncementDetail from './AnnouncementDetail';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { PlusIcon, CalendarIcon, UserIcon, TrashIcon } from '../icons/Icons';

const AnnouncementsTab: React.FC = () => {
    const { announcements, addAnnouncement, deleteAnnouncement, currentUser } = useData();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const handleCreate = async (data: { title: string; content: string; author: string; date: string }) => {
        const newAnnouncement: Announcement = {
            id: Date.now().toString(),
            title: data.title,
            content: data.content,
            date: data.date,
            author: currentUser?.name || data.author || 'Admin',
            readCount: 0,
            category: 'Général',
            target: 'Toute l\'Assemblée',
            startDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.id || 'unknown',
            isActive: true
        };
        await addAnnouncement(newAnnouncement);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
            await deleteAnnouncement(id);
            if (selectedAnnouncement?.id === id) {
                setSelectedAnnouncement(null);
            }
        }
    };

    if (selectedAnnouncement) {
        return (
            <div className="bg-card dark:bg-card-dark rounded-2xl shadow-soft dark:shadow-none min-h-[600px] overflow-hidden relative">
                <AnnouncementDetail
                    announcement={selectedAnnouncement}
                    onClose={() => setSelectedAnnouncement(null)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Annonces Officielles</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gérez les communications visibles par tous les membres.</p>
                </div>
                <Button onClick={() => setIsDrawerOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Nouvelle Annonce
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="text-6xl mb-4">📢</div>
                        <p className="text-slate-400 font-medium">Aucune annonce publiée</p>
                    </div>
                ) : (
                    announcements.map(announcement => (
                        <Card
                            key={announcement.id}
                            onClick={() => setSelectedAnnouncement(announcement)}
                            className="cursor-pointer hover:shadow-lg dark:shadow-none transition-all group relative overflow-hidden border-2 border-transparent hover:border-primary dark:border-white/20/10"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleDelete(announcement.id, e)}
                                    className="p-2 bg-card dark:bg-card-dark rounded-full shadow-md dark:shadow-none text-red-500 hover:bg-red-50"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-white bg-primary/10 px-2 py-1 rounded-md">
                                    Annonce
                                </span>
                            </div>

                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3 line-clamp-2 leading-tight">
                                {announcement.title}
                            </h4>

                            <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-6">
                                {announcement.content}
                            </p>

                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-t border-slate-100 dark:border-dark pt-4">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-3 h-3" />
                                    {announcement.date}
                                </div>
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-3 h-3" />
                                    {announcement.author}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <AnnouncementDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSubmit={handleCreate}
            />
        </div>
    );
};

export default AnnouncementsTab;
