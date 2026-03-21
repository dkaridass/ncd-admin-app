import React from 'react';
import Card from '../ui/Card';
import { CommunicationMessage } from '../../types';

interface Props {
    messages: CommunicationMessage[];
}

const MessageHistory: React.FC<Props> = ({ messages }) => {
    if (messages.length === 0) {
        return (
            <Card className="border-none shadow-soft dark:shadow-none rounded-2xl p-12">
                <div className="text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-slate-400 font-medium">Aucun message envoyé</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-soft dark:shadow-none rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-dark">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                Date
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                Sujet / Aperçu
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                Destinataires
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                Type
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                Statut
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">
                                Coût
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {messages.map((message) => (
                            <tr key={message.id} className="hover:bg-slate-50 dark:bg-white/[0.02]/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                                        {new Date(message.sentAt).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(message.sentAt).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {message.subject ? (
                                        <>
                                            <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                                                {message.subject}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                                {message.content.substring(0, 80)}...
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                                            {message.content.substring(0, 100)}...
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-white text-xs font-bold">
                                        {message.recipientCount} membres
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                        {message.type === 'SMS' && '📱 SMS'}
                                        {message.type === 'EMAIL' && '📧 Email'}
                                        {message.type === 'BOTH' && '📱📧 Les Deux'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${message.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : message.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700' }`}
                                    >
                                        {message.status === 'SENT' && '✓ Envoyé'}
                                        {message.status === 'FAILED' && '✗ Échec'}
                                        {message.status === 'SENDING' && '⏳ En cours'}
                                        {message.status === 'SCHEDULED' && '📅 Planifié'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {message.cost ? (
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                            ${message.cost.toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default MessageHistory;
