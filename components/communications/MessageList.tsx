
import React from 'react';
import { Announcement } from '../../types';
import { MessageSquareIcon, ChevronRightIcon, UserIcon, CalendarIcon } from '../icons/Icons';

interface MessageListProps {
    announcements: Announcement[];
    selectedId?: string;
    onSelect: (id: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ announcements, selectedId, onSelect }) => {
    return (
        <div className="flex flex-col h-full bg-card dark:bg-card-dark border-r border-slate-100 dark:border-dark overflow-y-auto">
            <div className="p-6 border-b border-slate-100 dark:border-dark">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Boîte de réception</h3>
            </div>
            <div className="flex-1">
                {announcements.length === 0 ? (
                    <div className="p-10 text-center opacity-40">
                        <MessageSquareIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-sm font-bold text-slate-400">Aucune annonce</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-50">
                        {announcements.map((announcement) => (
                            <li key={announcement.id}>
                                <button
                                    onClick={() => onSelect(announcement.id)}
                                    className={`w-full text-left p-6 transition-all hover:bg-slate-50 dark:bg-white/[0.02] relative group ${selectedId === announcement.id ? 'bg-primary/5 hover:bg-primary/5' : '' }`}
                                >
                                    {selectedId === announcement.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`text-sm font-bold truncate pr-4 ${selectedId === announcement.id ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>
                                            {announcement.title}
                                        </h4>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{announcement.date}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                        {announcement.content}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-500 dark:text-slate-400">
                                            <UserIcon className="w-3 h-3" />
                                            <span className="text-[9px] font-bold uppercase tracking-wide">{announcement.author}</span>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default MessageList;
