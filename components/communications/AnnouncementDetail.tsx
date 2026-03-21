
import React from 'react';
import { Announcement } from '../../types';
import { CalendarIcon, UserIcon, EditIcon, TrashIcon, ShareIcon } from '../icons/Icons';
import Button from '../ui/Button';

interface AnnouncementDetailProps {
    announcement?: Announcement;
    onClose: () => void; // For mobile back button
}

const AnnouncementDetail: React.FC<AnnouncementDetailProps> = ({ announcement, onClose }) => {
    if (!announcement) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 p-10">
                <div className="w-24 h-24 bg-slate-50 dark:bg-white/[0.02] rounded-full flex items-center justify-center mb-6">
                    <ShareIcon className="w-10 h-10 opacity-20" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">Sélectionnez une annonce</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card dark:bg-card-dark custom-scrollbar overflow-y-auto">
            {/* Mobile Header */}
            <div className="md:hidden p-4 border-b border-slate-100 dark:border-dark">
                <button onClick={onClose} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    ← Retour
                </button>
            </div>

            <div className="p-8 md:p-12 max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="mb-10 border-b border-slate-100 dark:border-dark pb-8">
                    <div className="flex flex-wrap gap-4 mb-6">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-white text-[10px] font-black uppercase tracking-widest">
                            Annonce Générale
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3" /> {announcement.date}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                        {announcement.title}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                            {announcement.author.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{announcement.author}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Auteur</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-slate max-w-none prose-p:leading-loose prose-headings:font-display prose-a:text-primary dark:text-white">
                    <p className="whitespace-pre-line text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                        {announcement.content}
                    </p>
                </div>

                {/* Footer Actions (Mock) */}
                <div className="mt-16 pt-8 border-t border-slate-100 dark:border-dark flex gap-4">
                    <Button variant="secondary" className="text-xs">
                        <EditIcon className="w-4 h-4 mr-2" />
                        Modifier
                    </Button>
                    <Button variant="danger" className="text-xs">
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Supprimer
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementDetail;
