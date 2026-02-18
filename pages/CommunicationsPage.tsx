import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import PageTransition from '../components/layout/PageTransition';
import PermissionGuard from '../components/auth/PermissionGuard';
import MessageComposer from '../components/communications/MessageComposer';
import RecipientSelector from '../components/communications/RecipientSelector';
import MessageHistory from '../components/communications/MessageHistory';
import { CommunicationMessage, MessageType } from '../types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CommunicationsPage: React.FC = () => {
    const { members, departments, currentUser } = useData();
    const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [messages, setMessages] = useState<CommunicationMessage[]>([]);
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async (messageData: {
        subject?: string;
        content: string;
        type: MessageType;
    }) => {
        if (selectedRecipients.length === 0) {
            alert('Veuillez sélectionner au moins un destinataire');
            return;
        }

        setIsSending(true);

        try {
            // Calculate SMS cost
            const smsCount = Math.ceil(messageData.content.length / 160);
            const costPerSMS = 0.10;
            const totalCost = (messageData.type === 'SMS' || messageData.type === 'BOTH')
                ? smsCount * costPerSMS * selectedRecipients.length
                : 0;

            const newMessage: CommunicationMessage = {
                id: Date.now().toString(),
                subject: messageData.subject,
                content: messageData.content,
                type: messageData.type,
                recipients: selectedRecipients,
                recipientCount: selectedRecipients.length,
                sentBy: currentUser?.id || 'unknown',
                sentByName: currentUser?.name || 'Unknown',
                sentAt: new Date().toISOString(),
                status: 'SENT',
                deliveryStatus: {
                    sent: selectedRecipients.length,
                    delivered: selectedRecipients.length,
                    failed: 0,
                },
                cost: totalCost,
            };

            // Save to Firestore
            await addDoc(collection(db, 'communications'), newMessage);

            // Add to local state
            setMessages(prev => [newMessage, ...prev]);

            // Show success message
            alert(`✅ Message envoyé avec succès à ${selectedRecipients.length} destinataire(s)!`);

            // Switch to history tab
            setActiveTab('history');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('❌ Erreur lors de l\'envoi du message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-primary font-display tracking-tight leading-none mb-1 uppercase italic">
                        Centre de Communication
                    </h2>
                    <p className="text-slate-500 font-medium italic opacity-80 uppercase tracking-widest text-[9px]">
                        Messages • Annonces • NCD La Pentecôte
                    </p>
                </div>

                {/* Permission Guard */}
                <PermissionGuard
                    permission="SEND_MESSAGES"
                    fallback={
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="text-6xl mb-4">🔒</div>
                            <p className="text-slate-400 font-medium">
                                Vous n'avez pas la permission d'envoyer des messages
                            </p>
                        </div>
                    }
                >
                    {/* Tabs */}
                    <div className="flex gap-3 mb-8">
                        {[
                            { id: 'send' as const, label: '📤 Envoyer un Message', icon: '📤' },
                            { id: 'history' as const, label: '📋 Historique', icon: '📋' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-4 px-6 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-primary/30'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'send' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Left: Recipient Selector */}
                            <div className="lg:col-span-2">
                                <RecipientSelector
                                    members={members}
                                    departments={departments}
                                    onSelectionChange={setSelectedRecipients}
                                />
                            </div>

                            {/* Right: Message Composer */}
                            <div className="lg:col-span-3">
                                <MessageComposer
                                    onSend={handleSendMessage}
                                    isLoading={isSending}
                                />

                                {/* Info Banner */}
                                <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                                    <div className="flex items-start gap-4">
                                        <span className="text-2xl">ℹ️</span>
                                        <div>
                                            <h4 className="font-bold text-blue-900 mb-2">Mode Démonstration</h4>
                                            <p className="text-sm text-blue-700">
                                                Les messages sont enregistrés dans Firestore mais ne sont pas envoyés réellement.
                                                L'intégration avec les fournisseurs SMS/Email sera ajoutée ultérieurement.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <MessageHistory messages={messages} />
                    )}
                </PermissionGuard>
            </div>
        </PageTransition>
    );
};

export default CommunicationsPage;
