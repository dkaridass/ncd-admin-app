import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useData } from '../../context/DataContext';
import { HeartIcon, CheckCircleIcon, UsersIcon, PhoneIcon } from '../icons/Icons';
import { FollowUp } from '../../types';
import { showSuccess, showError } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';

const AbsenteeFollowUpWidget: React.FC = () => {
    const { members, followUps, addFollowUp, resolveFollowUp, hasPermission } = useData();
    const [isScanning, setIsScanning] = useState(false);

    // Only viewable by those with PASTORAL_CARE permission
    if (!hasPermission('VIEW_PASTORAL_CARE') && !hasPermission('SUPER_ADMIN')) {
        return null;
    }

    const activeFollowUps = (followUps || []).filter(f => f.status !== 'Résolu');
    const resolvedCount = (followUps || []).filter(f => f.status === 'Résolu').length;

    const handleScanAbsentees = async () => {
        setIsScanning(true);
        try {
            const now = new Date();
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            let newCount = 0;

            const membersToFlag = members.filter(m => {
                if (m.status !== 'Fidèle' && m.status !== 'Visiteur') return false;
                if (!m.lastAttendedDate) return false; // Ignore those without dates
                const lastAttended = new Date(m.lastAttendedDate);
                if (lastAttended > twoWeeksAgo) return false;

                // Check if they already have an active follow-up
                const hasActive = activeFollowUps.some(f => f.memberId === m.id);
                return !hasActive;
            });

            for (const member of membersToFlag) {
                await addFollowUp({
                    memberId: member.id,
                    memberName: member.name,
                    reason: 'Absent 2+ dimanches consécutifs',
                    status: 'À contacter',
                    createdAt: new Date().toISOString()
                });
                newCount++;
            }

            if (newCount > 0) {
                showSuccess(`${newCount} nouveaux suivis créés automatiquement.`);
            } else {
                showSuccess(`Aucun nouveau fidèle identifié avec une absence prolongée (basé sur la date de dernière présence).`);
            }
        } catch (e: any) {
            showError(`Erreur lors du scan: ${e.message}`);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <Card
            title="Suivi Pastoral: Absences prolongées"
        >

            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4">
                    <Badge variant="warning">{activeFollowUps.length} En cours</Badge>
                    <Badge variant="success" className="opacity-70">{resolvedCount} Résolus</Badge>
                </div>
                {hasPermission('MANAGE_TASKS') && (
                    <Button
                        onClick={handleScanAbsentees}
                        isLoading={isScanning}
                        variant="white"
                        className="text-xs border-border text-slate-700 hover:bg-slate-50 border shadow-sm"
                    >
                        <UsersIcon className="w-4 h-4 mr-2 text-rose-500" />
                        Scanner Absences
                    </Button>
                )}
            </div>

            <div className="space-y-0">
                <AnimatePresence>
                    {activeFollowUps.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-slate-50 p-6 rounded-md border border-dashed border-border text-center"
                        >
                            <HeartIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm font-medium">Aucun suivi pastoral d'absence en attente.</p>
                        </motion.div>
                    ) : (
                        activeFollowUps.map(followUp => {
                            const member = members.find(m => m.id === followUp.memberId);
                            return (
                                <motion.div
                                    key={followUp.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="p-3 border-b border-border last:border-0 hover:bg-rose-50/50 flex justify-between items-center group/item transition-colors"
                                >
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{followUp.memberName}</h4>
                                        <p className="text-xs text-rose-600 font-medium mt-0.5">{followUp.reason}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                                            Créé le: {new Date(followUp.createdAt).toLocaleDateString('fr-FR')}
                                            {followUp.status !== 'À contacter' && ` • ${followUp.status}`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {member?.phone && (
                                            <a
                                                href={`tel:${member.phone}`}
                                                className="w-8 h-8 rounded bg-white border border-border flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                                                title="Appeler"
                                            >
                                                <PhoneIcon className="w-4 h-4" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => resolveFollowUp(followUp.id, 'Appel effectué, le membre va bien.')}
                                            className="w-8 h-8 rounded bg-white border border-emerald-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
                                            title="Marquer comme résolu"
                                        >
                                            <CheckCircleIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
};

export default AbsenteeFollowUpWidget;
