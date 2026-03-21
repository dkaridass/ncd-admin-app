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
            className="border-none shadow-premium dark:shadow-none rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex gap-4">
                    <Badge variant="warning">{activeFollowUps.length} En cours</Badge>
                    <Badge variant="success" className="opacity-70">{resolvedCount} Résolus</Badge>
                </div>
                {hasPermission('MANAGE_TASKS') && (
                    <Button
                        onClick={handleScanAbsentees}
                        isLoading={isScanning}
                        variant="white"
                        className="text-xs shadow-sm dark:shadow-none"
                    >
                        <UsersIcon className="w-4 h-4 mr-2 text-rose-500" />
                        Scanner Absences
                    </Button>
                )}
            </div>

            <div className="space-y-3 mt-4 relative z-10">
                <AnimatePresence>
                    {activeFollowUps.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-slate-50 dark:bg-white/[0.02] p-6 rounded-3xl border border-slate-100 dark:border-dark/50 text-center"
                        >
                            <HeartIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Aucun suivi pastoral d'absence en attente.</p>
                        </motion.div>
                    ) : (
                        activeFollowUps.map(followUp => {
                            const member = members.find(m => m.id === followUp.memberId);
                            return (
                                <motion.div
                                    key={followUp.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 flex justify-between items-center group/item hover:bg-rose-50 transition-colors"
                                >
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{followUp.memberName}</h4>
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
                                                className="w-8 h-8 rounded-xl bg-card dark:bg-card-dark border border-slate-100 dark:border-dark flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:text-indigo-300 hover:border-indigo-200 transition-colors shadow-sm dark:shadow-none"
                                                title="Appeler"
                                            >
                                                <PhoneIcon className="w-4 h-4" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => resolveFollowUp(followUp.id, 'Appel effectué, le membre va bien.')}
                                            className="w-8 h-8 rounded-xl bg-card dark:bg-card-dark border border-emerald-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm dark:shadow-none"
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
