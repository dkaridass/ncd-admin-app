import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MessageType } from '../../types';

interface Props {
    onSend: (message: {
        subject?: string;
        content: string;
        type: MessageType;
    }) => void;
    isLoading?: boolean;
}

const MessageComposer: React.FC<Props> = ({ onSend, isLoading }) => {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [messageType, setMessageType] = useState<MessageType>('BOTH');

    const charCount = content.length;
    const smsCount = Math.ceil(charCount / 160);
    const costPerSMS = 0.10; // $0.10 per SMS

    const handleSend = () => {
        if (!content.trim()) return;

        onSend({
            subject: messageType !== 'SMS' ? subject : undefined,
            content: content.trim(),
            type: messageType,
        });

        // Reset form
        setSubject('');
        setContent('');
    };

    return (
        <Card className="border-none shadow-soft dark:shadow-none rounded-2xl p-8">
            <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-6">Composer un Message</h3>

            {/* Message Type Selection */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">Type de Message</label>
                <div className="flex gap-3">
                    {(['SMS', 'EMAIL', 'BOTH'] as MessageType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setMessageType(type)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${messageType === type ? 'bg-primary text-white shadow-md dark:shadow-none' : 'bg-slate-100 text-slate-600 dark:text-slate-400 hover:bg-slate-200' }`}
                        >
                            {type === 'SMS' ? '📱 SMS' : type === 'EMAIL' ? '📧 Email' : '📱📧 Les Deux'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Subject (Email only) */}
            {messageType !== 'SMS' && (
                <div className="mb-6">
                    <Input
                        label="Sujet (Email)"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Entrez le sujet du message..."
                        className="rounded-xl"
                    />
                </div>
            )}

            {/* Message Content */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">
                    Message {messageType === 'SMS' || messageType === 'BOTH' ? '(SMS)' : ''}
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Écrivez votre message ici..."
                    rows={8}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-dark rounded-xl bg-card dark:bg-card-dark text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-primary transition-all resize-none"
                />

                {/* Character Counter */}
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {charCount} caractères
                        </span>
                        {(messageType === 'SMS' || messageType === 'BOTH') && (
                            <>
                                <span className="text-xs text-slate-300">•</span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {smsCount} SMS
                                </span>
                                <span className="text-xs text-slate-300">•</span>
                                <span className="text-xs font-bold text-emerald-600">
                                    ~${(smsCount * costPerSMS).toFixed(2)} par destinataire
                                </span>
                            </>
                        )}
                    </div>

                    {charCount > 160 && (messageType === 'SMS' || messageType === 'BOTH') && (
                        <span className="text-xs font-bold text-orange-600">
                            ⚠️ Message long ({smsCount} SMS)
                        </span>
                    )}
                </div>
            </div>

            {/* Send Button */}
            <Button
                onClick={handleSend}
                disabled={!content.trim() || isLoading}
                className="w-full py-4 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Envoi en cours...' : `📤 Envoyer le Message`}
            </Button>
        </Card>
    );
};

export default MessageComposer;
