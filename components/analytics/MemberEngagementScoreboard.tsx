
import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { motion } from 'framer-motion';
import { Member } from '../../types';
import AnimatedCounter from '../ui/AnimatedCounter';

interface MemberScore {
    member: Member;
    score: number;
    tier: 'Gold' | 'Silver' | 'Bronze' | 'New';
    breakdown: {
        profile: number;
        activity: number;
        leadership: number;
        giving: number;
    };
    givingCount: number;
}

const MemberEngagementScoreboard: React.FC = () => {
    const { members, financeRecords } = useData();
    const [expandedMember, setExpandedMember] = useState<string | null>(null);

    // Pre-compute giving frequency per member (last 90 days)
    const givingMap = useMemo(() => {
        const map = new Map<string, number>();
        if (!financeRecords?.length) return map;

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const cutoff = ninetyDaysAgo.toISOString().split('T')[0];

        for (const rec of financeRecords) {
            if (rec.type === 'Dépense') continue; // Skip expenses
            if (!rec.memberName || rec.date < cutoff) continue;
            const name = rec.memberName.trim().toLowerCase();
            map.set(name, (map.get(name) || 0) + 1);
        }
        return map;
    }, [financeRecords]);

    const scores: MemberScore[] = useMemo(() => {
        if (!members?.length) return [];

        return members.map(member => {
            let profileScore = 0;
            let activityScore = 0;
            let leadershipScore = 0;
            let givingScore = 0;

            // 1. Profile Completeness (Max 25)
            if (member.name) profileScore += 2;
            if (member.phone) profileScore += 3;
            if (member.email) profileScore += 3;
            if (member.whatsapp) profileScore += 2;
            if (member.birthDate) profileScore += 3;
            if (member.address || member.commune) profileScore += 3;
            if (member.civilState) profileScore += 2;
            // Only count real uploaded photos, not auto-generated placeholders
            if (member.avatarUrl && !member.avatarUrl.includes('ui-avatars.com')) profileScore += 3;
            if (member.reference) profileScore += 2;
            if (member.joinDate) profileScore += 2;

            // 2. Activity / Belonging (Max 30)
            if (member.status === 'Fidèle') activityScore += 6;
            else if (member.status === 'Visiteur') activityScore += 2;

            // Department involvement
            const deptCount = member.departmentIds?.length || (member.primaryDepartmentId ? 1 : 0);
            if (deptCount >= 2) activityScore += 12;
            else if (deptCount === 1) activityScore += 8;

            if (member.isVolunteer) activityScore += 8;
            if (member.isBaptised) activityScore += 4;

            // 3. Leadership & Role (Max 25)
            if (member.isLeader) {
                leadershipScore += 12;
            }

            const rolePoints: Record<string, number> = {
                'Pasteur': 12, 'Pasteure': 12,
                'Berger': 10, 'Bergère': 10,
                'Vice-président': 10,
                'Admin': 8, 'Admin adjoint': 6,
                'Secrétaire': 6, 'Serviteur': 6,
                'Sœur': 1, 'Frère': 1, 'Fidèle': 0
            };
            leadershipScore += rolePoints[member.role] || 0;

            if (member.responsibilities && member.responsibilities.length > 0) {
                leadershipScore += Math.min(8, member.responsibilities.length * 3);
            }

            // 4. Financial Engagement (Max 20) — based on giving FREQUENCY, not amount
            const memberNameLower = member.name?.trim().toLowerCase() || '';
            const givingCount = givingMap.get(memberNameLower) || 0;

            if (givingCount >= 8) givingScore = 20;       // Very active giver (2+/month)
            else if (givingCount >= 4) givingScore = 15;  // Regular giver (monthly+)
            else if (givingCount >= 2) givingScore = 10;  // Occasional giver
            else if (givingCount >= 1) givingScore = 5;   // Rare giver

            const totalScore = Math.min(100, profileScore + activityScore + leadershipScore + givingScore);
            let tier: MemberScore['tier'] = 'New';
            if (totalScore >= 70) tier = 'Gold';
            else if (totalScore >= 40) tier = 'Silver';
            else if (totalScore >= 15) tier = 'Bronze';

            return {
                member,
                score: totalScore,
                tier,
                breakdown: { profile: profileScore, activity: activityScore, leadership: leadershipScore, giving: givingScore },
                givingCount
            };
        }).sort((a, b) => b.score - a.score);
    }, [members, givingMap]);

    const stats = useMemo(() => {
        return {
            total: scores.length,
            gold: scores.filter(s => s.tier === 'Gold').length,
            silver: scores.filter(s => s.tier === 'Silver').length,
            bronze: scores.filter(s => s.tier === 'Bronze').length,
            newCount: scores.filter(s => s.tier === 'New').length,
            avg: scores.length ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0
        };
    }, [scores]);

    const topContributors = scores.slice(0, 5);

    if (!members?.length) return null;

    const BreakdownBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
        <div className="flex items-center gap-2">
            <span className="text-[8px] font-bold text-slate-400 w-16 text-right uppercase tracking-wider">{label}</span>
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
            <span className="text-[9px] font-black text-slate-500 w-6 text-right">{value}</span>
        </div>
    );

    return (
        <div className="bg-card dark:bg-card-dark rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm dark:shadow-none overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-50 dark:border-dark flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                        🔥 Score d'Engagement
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Profil + Activité + Leadership + Contributions
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-2xl font-black text-primary dark:text-gold font-display">
                            <AnimatedCounter value={stats.avg} />
                        </p>
                        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Score Moyen</p>
                    </div>
                </div>
            </div>

            {/* Tier Distribution Bar */}
            <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-50 dark:border-dark">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Gold ({stats.gold})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Silver ({stats.silver})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-700" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Bronze ({stats.bronze})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-600" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">New ({stats.newCount})</span>
                    </div>
                </div>

                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.gold / stats.total) * 100}%` }} transition={{ duration: 1 }} className="bg-yellow-400 h-full" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.silver / stats.total) * 100}%` }} transition={{ duration: 1, delay: 0.2 }} className="bg-slate-400 h-full" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.bronze / stats.total) * 100}%` }} transition={{ duration: 1, delay: 0.4 }} className="bg-amber-700 h-full" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.newCount / stats.total) * 100}%` }} transition={{ duration: 1, delay: 0.6 }} className="bg-slate-200 dark:bg-slate-600 h-full" />
                </div>
            </div>

            {/* Top Contributors List */}
            <div className="p-6">
                <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                    Membres les plus engagés
                </h4>
                <div className="space-y-2">
                    {topContributors.map((s, i) => (
                        <div key={s.member.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-4 group cursor-pointer py-2 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                onClick={() => setExpandedMember(expandedMember === s.member.id ? null : s.member.id)}
                            >
                                {/* Rank Badge */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${i === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' : i === 1 ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' : i === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-500' : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                                    {i + 1}
                                </div>

                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600">
                                    {s.member.avatarUrl ? (
                                        <img src={s.member.avatarUrl} alt={s.member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/5 dark:bg-primary/20 text-primary dark:text-gold font-bold text-sm">
                                            {s.member.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors">
                                        {s.member.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10 uppercase tracking-wider truncate max-w-[120px]">
                                            {s.member.role}
                                        </span>
                                        {s.givingCount > 0 && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10 uppercase tracking-wider">
                                                {s.givingCount}× dons
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-black text-primary dark:text-gold font-display">
                                        {s.score}
                                    </p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-[-2px]">
                                        Points
                                    </p>
                                </div>
                            </motion.div>

                            {/* Expandable Breakdown */}
                            {expandedMember === s.member.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="ml-12 mr-2 mb-2 p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-dark space-y-2"
                                >
                                    <BreakdownBar label="Profil" value={s.breakdown.profile} max={25} color="bg-blue-400" />
                                    <BreakdownBar label="Activité" value={s.breakdown.activity} max={30} color="bg-purple-400" />
                                    <BreakdownBar label="Leader" value={s.breakdown.leadership} max={25} color="bg-amber-400" />
                                    <BreakdownBar label="Dons" value={s.breakdown.giving} max={20} color="bg-emerald-400" />
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MemberEngagementScoreboard;
