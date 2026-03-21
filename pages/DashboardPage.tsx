
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { UsersIcon, CalendarIcon, DollarSignIcon, HeartIcon, SparklesIcon, PlusCircleIcon, FileTextIcon, ShieldIcon, TrendingUpIcon } from '../components/icons/Icons';
import { useData } from '../context/DataContext';
import AttendanceChart from '../components/analytics/AttendanceChart';
import RevenueByServiceChart from '../components/analytics/RevenueByServiceChart';
import { AttendanceRecord, FinanceRecord, FinanceAccount } from '../types';
import { aiService } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import MorningPulseCard from '../components/ai/MorningPulseCard';
import { ensureSuperAdminExists, isCurrentUserSuperAdminEmail } from '../utils/ensureSuperAdmin';
import AccountBalancesStrip from '../components/finance/AccountBalancesStrip';
import SundayQuickEntry from '../components/finance/SundayQuickEntry';
import SundayCompletenessAlert from '../components/analytics/SundayCompletenessAlert';
import DepartmentScoreboard from '../components/analytics/DepartmentScoreboard';
import AttendanceTrends from '../components/analytics/AttendanceTrends';
import ActivityFeed from '../components/analytics/ActivityFeed';
import MemberEngagementScoreboard from '../components/analytics/MemberEngagementScoreboard';
import AbsenteeFollowUpWidget from '../components/pastoral/AbsenteeFollowUpWidget';
import UpcomingCelebrationsWidget from '../components/pastoral/UpcomingCelebrationsWidget';
import { showSuccess, showError, showInfo } from '../utils/toast';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const dataContext = useData();
    // Safely destructure with defaults to prevent undefined errors
    const attendance = dataContext.attendance || [];
    const financeRecords = dataContext.financeRecords || [];
    const members = dataContext.members || [];
    const departments = dataContext.departments || [];
    const tasks = dataContext.tasks || [];
    const announcements = dataContext.announcements || [];
    const { addAttendance, addFinanceRecord, addMember, updateTask, currentUser, isLoading, hasPermission, totalMembersCount, totalFinancesCount } = dataContext;
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsight, setAiInsight] = useState<any | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isFinanceSubmitting, setIsFinanceSubmitting] = useState(false);
    const [isMemberSubmitting, setIsMemberSubmitting] = useState(false);
    const [isReportSubmitting, setIsReportSubmitting] = useState(false);
    const [isFixingRole, setIsFixingRole] = useState(false);
    const [isSundayEntryOpen, setIsSundayEntryOpen] = useState(false);

    const [reportForm, setReportForm] = useState({
        sessionName: '1er Culte (Dim)',
        men: '',
        women: '',
        children: '',
        date: new Date().toISOString().split('T')[0]
    });

    const todayDepts = useMemo(() => {
        if (!departments || !Array.isArray(departments)) return [];
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const currentDay = days[new Date().getDay()];
        return departments.filter(d => d.meetingDay?.includes(currentDay) || d.meetingDay === 'Lundi à Samedi').slice(0, 5);
    }, [departments]);

    const chartData = useMemo(() => {
        if (!attendance || !Array.isArray(attendance) || attendance.length === 0) return [];
        return attendance.slice(0, 6).reverse().map(session => ({
            name: session.sessionName?.split(' ')[0] || 'Session', // Simplify name for chart
            attendance: session.totalCount || 0,
        }));
    }, [attendance]);

    // Metrics Logic
    const lastSession = attendance && Array.isArray(attendance) ? attendance[0] : null;
    const prevSession = attendance && Array.isArray(attendance) ? attendance[1] : null;
    const trendValue = lastSession && prevSession ? lastSession.totalCount - prevSession.totalCount : 0;
    const trendPercent = prevSession ? Math.round((trendValue / prevSession.totalCount) * 100) : 0;

    const totalUSD = (financeRecords && Array.isArray(financeRecords) ? financeRecords : []).filter(r => r.currency === 'USD' && r.type !== 'Dépense').reduce((s, r) => s + r.amount, 0);
    const totalCDF = (financeRecords && Array.isArray(financeRecords) ? financeRecords : []).filter(r => r.currency === 'CDF' && r.type !== 'Dépense').reduce((s, r) => s + r.amount, 0);

    // Calculate member growth trend (last 30 days vs previous 30 days)
    const memberTrend = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        if (!members || !Array.isArray(members)) return { percent: 0, isUp: false };

        const recentMembers = members.filter(m => {
            const joinDate = new Date(m.joinDate);
            return joinDate >= thirtyDaysAgo;
        }).length;

        const previousMembers = members.filter(m => {
            const joinDate = new Date(m.joinDate);
            return joinDate >= sixtyDaysAgo && joinDate < thirtyDaysAgo;
        }).length;

        if (previousMembers === 0) return { percent: 0, isUp: recentMembers > 0 };
        const percent = Math.round(((recentMembers - previousMembers) / previousMembers) * 100);
        return { percent, isUp: percent >= 0 };
    }, [members]);

    // Calculate finance trends (this month vs last month)
    const financeTrends = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        if (!financeRecords || !Array.isArray(financeRecords)) {
            return { usd: { percent: 0, isUp: false }, cdf: { percent: 0, isUp: false } };
        }

        const thisMonthUSD = financeRecords
            .filter(r => {
                const rDate = new Date(r.date);
                return rDate >= startOfThisMonth && r.currency === 'USD' && r.type !== 'Dépense';
            })
            .reduce((s, r) => s + r.amount, 0);

        const lastMonthUSD = financeRecords
            .filter(r => {
                const rDate = new Date(r.date);
                return rDate >= startOfLastMonth && rDate <= endOfLastMonth && r.currency === 'USD' && r.type !== 'Dépense';
            })
            .reduce((s, r) => s + r.amount, 0);

        const thisMonthCDF = financeRecords
            .filter(r => {
                const rDate = new Date(r.date);
                return rDate >= startOfThisMonth && r.currency === 'CDF' && r.type !== 'Dépense';
            })
            .reduce((s, r) => s + r.amount, 0);

        const lastMonthCDF = financeRecords
            .filter(r => {
                const rDate = new Date(r.date);
                return rDate >= startOfLastMonth && rDate <= endOfLastMonth && r.currency === 'CDF' && r.type !== 'Dépense';
            })
            .reduce((s, r) => s + r.amount, 0);

        const usdTrend = lastMonthUSD > 0 ? Math.round(((thisMonthUSD - lastMonthUSD) / lastMonthUSD) * 100) : 0;
        const cdfTrend = lastMonthCDF > 0 ? Math.round(((thisMonthCDF - lastMonthCDF) / lastMonthCDF) * 100) : 0;

        return {
            usd: { percent: usdTrend, isUp: usdTrend >= 0 },
            cdf: { percent: cdfTrend, isUp: cdfTrend >= 0 }
        };
    }, [financeRecords]);

    const pendingTasks = (tasks && Array.isArray(tasks) ? tasks : []).filter(t => t.status !== 'Terminé' && t.status !== 'DONE').slice(0, 5);

    const handleAIAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            // Check if Groq is configured
            if (!aiService.isConfigured()) {
                showError('GROQ_API_KEY non configurée. Veuillez la configurer dans Paramètres > Système.');
                setIsAnalyzing(false);
                return;
            }

            const summary = {
                totalMembers: totalMembersCount || 0,
                attendance: (attendance && Array.isArray(attendance) && attendance.length > 0 ? attendance.slice(0, 1)[0] : null),
                financeSummary: (financeRecords && Array.isArray(financeRecords) ? financeRecords.slice(0, 3) : []),
            };

            const insight = await aiService.generateDashboardInsight(summary);
            setAiInsight(insight);
            showSuccess('✅ Analyse IA générée avec succès');
        } catch (e: any) {
            console.error("AI Analysis Error:", e);
            showError(`Erreur lors de l'analyse IA: ${e?.message || 'Erreur inconnue'}`);
            setAiInsight(null);
        }
        setIsAnalyzing(false);
    };

    // Quick Finance Entry State
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
    const [financeForm, setFinanceForm] = useState({
        amount: '',
        currency: 'CDF' as 'CDF' | 'USD',
        type: 'Offrande' as any,
        account: 'Cash' as FinanceAccount,
        notes: ''
    });

    const openFinanceModal = () => {
        setIsFinanceModalOpen(true);
        setFinanceForm({ amount: '', currency: 'CDF', type: 'Offrande', account: 'Cash', notes: '' });
    };

    const handleFinanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(financeForm.amount);
        if (!amount || amount <= 0) {
            showError('Montant invalide');
            return;
        }

        setIsFinanceSubmitting(true);
        try {
            const newRecord: Omit<FinanceRecord, 'id'> = {
                type: financeForm.type,
                amount: amount,
                currency: financeForm.currency,
                account: financeForm.account,
                date: new Date().toISOString().split('T')[0],
                serviceName: '1er Culte (Dim)',
                recordedBy: currentUser?.name || 'Admin',
                isApproved: true,
                notes: financeForm.notes || 'Saisie rapide Dashboard'
            };

            if (addFinanceRecord) {
                await addFinanceRecord(newRecord);
                showSuccess(`✅ ${financeForm.type} enregistré avec succès`);
                setIsFinanceModalOpen(false);
                setFinanceForm({ amount: '', currency: 'CDF', type: 'Offrande', account: 'Cash', notes: '' });
            }
        } catch (error: any) {
            showError(`Erreur lors de l'enregistrement: ${error?.message || 'Erreur inconnue'}`);
        } finally {
            setIsFinanceSubmitting(false);
        }
    };

    // Quick Member Add State
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [memberForm, setMemberForm] = useState({
        name: '',
        phone: '',
        status: 'Fidèle' as 'Fidèle' | 'Visiteur' | 'Archivé',
        gender: 'Homme' as 'Homme' | 'Femme'
    });

    const handleMemberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberForm.name || !memberForm.name.trim()) {
            showError('Le nom est requis');
            return;
        }

        setIsMemberSubmitting(true);
        try {
            if (addMember) {
                await addMember({
                    id: Date.now().toString(),
                    name: memberForm.name.trim(),
                    phone: memberForm.phone.trim(),
                    status: memberForm.status,
                    gender: memberForm.gender,
                    role: 'Fidèle',
                    birthDate: '',
                    email: '',
                    joinDate: new Date().toISOString().split('T')[0],
                    family: '',
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(memberForm.name)}&background=1E1B4B&color=fff`
                } as any);
                showSuccess('✅ Membre ajouté avec succès');
                setIsMemberModalOpen(false);
                setMemberForm({ name: '', phone: '', status: 'Fidèle', gender: 'Homme' });
            }
        } catch (error: any) {
            showError(`Erreur lors de l'ajout du membre: ${error?.message || 'Erreur inconnue'}`);
        } finally {
            setIsMemberSubmitting(false);
        }
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const totalCount = (parseInt(reportForm.men) || 0) + (parseInt(reportForm.women) || 0) + (parseInt(reportForm.children) || 0);
        const newAttendance: AttendanceRecord = {
            id: Date.now().toString(),
            date: reportForm.date,
            sessionName: reportForm.sessionName,
            menCount: parseInt(reportForm.men) || 0,
            womenCount: parseInt(reportForm.women) || 0,
            childrenCount: parseInt(reportForm.children) || 0,
            totalCount
        };
        await addAttendance(newAttendance);
        setIsReportModalOpen(false);
    };



    return (
        <div className="pb-12 max-w-[1600px] mx-auto relative">
            {/* World Class Brand Watermark */}
            <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
                <img
                    src="/logo.png"
                    className="w-[1200px] opacity-[0.03] grayscale-0 mix-blend-multiply blur-sm"
                    alt=""
                />
            </div>

            <div className="relative z-10">
                {/* Executive Summary Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-secondary mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                            Aperçu Exécutif
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif text-primary dark:text-white mb-2 leading-tight">
                            Bonjour, {currentUser?.name || 'Pasteur'}.
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                            Voici l'état actuel de votre ministère et des finances.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {hasPermission && (hasPermission('SUPER_ADMIN') || hasPermission('ACCESS_AI_CONFIG')) && (
                            <Button
                                onClick={handleAIAnalysis}
                                isLoading={isAnalyzing}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md dark:shadow-none shadow-indigo-500 dark:shadow-none/20 text-sm font-bold"
                            >
                                <SparklesIcon className="w-4 h-4 mr-2" />
                                Synthèse IA
                            </Button>
                        )}
                    </div>
                </div>

                {/* SUPER ADMIN BOOTSTRAP BANNER - Only visible to admin@ncd.com who is NOT yet SUPER_ADMIN */}
                {isCurrentUserSuperAdminEmail() && currentUser?.role !== 'SUPER_ADMIN' && (
                    <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl dark:shadow-none animate-fade-in">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-card dark:bg-card-dark backdrop-blur-sm flex items-center justify-center shrink-0">
                                <ShieldIcon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-display font-black mb-2">⚠️ Action Requise: Activer SUPER_ADMIN</h3>
                                <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                                    Vous êtes connecté en tant que <strong>admin@ncd.com</strong> mais votre rôle actuel est <strong>VIEWER</strong>.
                                    Cliquez sur le bouton ci-dessous pour activer vos privilèges de Super Administrateur dans la base de données.
                                </p>
                                <Button
                                    onClick={async () => {
                                        setIsFixingRole(true);
                                        try {
                                            const updated = await ensureSuperAdminExists();
                                            if (updated) {
                                                showSuccess('✅ Rôle SUPER_ADMIN configuré avec succès! Rechargement de la page...');
                                                setTimeout(() => window.location.reload(), 1500);
                                            } else {
                                                showInfo('✅ Votre rôle SUPER_ADMIN est déjà correct.');
                                            }
                                        } catch (error: any) {
                                            showError(`Erreur: ${error.message}`);
                                        } finally {
                                            setIsFixingRole(false);
                                        }
                                    }}
                                    isLoading={isFixingRole}
                                    disabled={isFixingRole}
                                    className="bg-card dark:bg-card-dark text-indigo-600 dark:text-indigo-300 font-black text-sm px-8 py-3 rounded-xl hover:bg-indigo-50 shadow-lg dark:shadow-none hover:shadow-xl dark:shadow-none transition-all"
                                >
                                    🔐 Activer SUPER_ADMIN Maintenant
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sunday Completeness Alert (Mon-Wed) */}
                <SundayCompletenessAlert />

                {/* Strategic Pulse */}
                <div className="mb-0">
                    <MorningPulseCard />
                </div>

                {/* Quick Actions Bar */}
                <div className="flex gap-4 mb-10 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4">
                    <Button
                        onClick={() => setIsReportModalOpen(true)}
                        variant="primary"
                        className="rounded-full px-8 py-3.5 text-xs shadow-lg dark:shadow-glow-primary whitespace-nowrap"
                    >
                        <PlusCircleIcon className="w-4 h-4 mr-2" />
                        Saisir Effectif
                    </Button>
                    <Button
                        onClick={() => setIsMemberModalOpen(true)}
                        variant="white"
                        className="rounded-full px-8 py-3.5 text-xs whitespace-nowrap border-2 border-slate-100 dark:border-dark"
                    >
                        <UsersIcon className="w-4 h-4 mr-2 text-primary" />
                        Nouveau Fidèle
                    </Button>
                    {hasPermission && hasPermission('VIEW_FINANCES') && (
                        <Button
                            onClick={() => openFinanceModal()}
                            variant="white"
                            className="rounded-full px-8 py-3.5 text-xs whitespace-nowrap border-2 border-slate-100 dark:border-dark"
                        >
                            <DollarSignIcon className="w-4 h-4 mr-2 text-emerald-600" />
                            Entrer Offrande
                        </Button>
                    )}
                </div>

                {/* Top KPI Row — Oversized Executive Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10"
                >
                    {([
                        {
                            label: 'Total Fidèles',
                            value: isLoading ? '...' : totalMembersCount,
                            icon: UsersIcon,
                            trend: isLoading ? '...' : `${memberTrend.isUp ? '+' : ''}${memberTrend.percent}%`,
                            trendUp: memberTrend.isUp,
                            onClick: () => navigate('/members'),
                            isFinance: false,
                            color: 'text-primary'
                        },
                        {
                            label: 'Dernier Culte',
                            value: isLoading ? '...' : (lastSession?.totalCount || '-'),
                            icon: UsersIcon,
                            trend: isLoading ? '...' : `${trendValue > 0 ? '+' : ''}${trendPercent}%`,
                            trendUp: trendValue >= 0,
                            onClick: () => navigate('/events'),
                            isFinance: false,
                            color: 'text-primary'
                        },
                        {
                            label: 'Recettes (USD)',
                            value: isLoading ? '...' : `$${totalUSD.toLocaleString()}`,
                            icon: DollarSignIcon,
                            trend: isLoading ? '...' : `${financeTrends.usd.isUp ? '+' : ''}${financeTrends.usd.percent}%`,
                            trendUp: financeTrends.usd.isUp,
                            isFinance: true,
                            onClick: () => navigate('/finances'),
                            color: 'text-emerald-700 dark:text-emerald-400'
                        },
                        {
                            label: 'Recettes (CDF)',
                            value: isLoading ? '...' : `FC ${totalCDF.toLocaleString()}`,
                            icon: DollarSignIcon,
                            trend: isLoading ? '...' : `${financeTrends.cdf.isUp ? '+' : ''}${financeTrends.cdf.percent}%`,
                            trendUp: financeTrends.cdf.isUp,
                            isFinance: true,
                            onClick: () => navigate('/finances'),
                            color: 'text-emerald-700 dark:text-emerald-400'
                        }
                    ] as const).filter(stat => !stat.isFinance || (hasPermission && hasPermission('VIEW_FINANCES'))).map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                            className="h-full"
                        >
                            <Card
                                onClick={stat.onClick}
                                className="p-6 md:p-8 transition-all duration-500 group cursor-pointer hover:-translate-y-1 hover:shadow-2xl dark:hover:shadow-glow-primary border-t-4 border-t-transparent hover:border-t-primary h-full flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                        <div className={`p-2 rounded-xl transition-colors ${stat.isFinance ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:bg-emerald-100' : 'bg-primary/5 text-primary dark:bg-primary-light/20 dark:text-primary-accent group-hover:bg-primary/10'}`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <h3 className={`text-4xl lg:text-5xl font-serif font-medium ${stat.color} tracking-tight`}>
                                            {isLoading ? '...' : (
                                                typeof stat.value === 'number' ? (
                                                    <AnimatedCounter value={stat.value} />
                                                ) : typeof stat.value === 'string' && stat.value.startsWith('$') ? (
                                                    <AnimatedCounter value={parseFloat(stat.value.replace(/[$,]/g, '')) || 0} prefix="$" />
                                                ) : typeof stat.value === 'string' && stat.value.startsWith('FC') ? (
                                                    <AnimatedCounter value={parseFloat(stat.value.replace(/[FC ,]/g, '')) || 0} prefix="FC " />
                                                ) : stat.value
                                            )}
                                        </h3>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center">
                                    <div className={`flex items-center text-[9px] md:text-xs font-bold px-2 py-1.5 rounded-lg ${stat.trendUp === true ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : stat.trendUp === false ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}>
                                        {stat.trendUp === true && <TrendingUpIcon className="w-3 h-3 mr-1" />}
                                        {stat.trendUp === false && <TrendingUpIcon className="w-3 h-3 mr-1 rotate-180" />}
                                        {stat.trend}
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-2">vs mois dernier</span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Account Balances Strip */}
                {hasPermission && hasPermission('VIEW_FINANCES') && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 px-2">Soldes des Comptes</h3>
                        <AccountBalancesStrip />
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Charts & Analysis (2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        <AttendanceChart />

                        {hasPermission && hasPermission('VIEW_FINANCES') && (
                            <RevenueByServiceChart />
                        )}

                        {/* Attendance Trends */}
                        <AttendanceTrends />

                        {/* Member Engagement */}
                        {hasPermission && (hasPermission('VIEW_MEMBERS') || hasPermission('SUPER_ADMIN')) && (
                            <MemberEngagementScoreboard />
                        )}
                    </div>

                    {/* Right Column: Agenda & Actions (1/3) */}
                    <div className="space-y-8 flex flex-col min-h-[800px]">
                        {/* Department Scoreboard */}
                        <DepartmentScoreboard />

                        {/* Activity Feed */}
                        <div className="flex-1 min-h-[400px]">
                            <ActivityFeed />
                        </div>

                        {/* Absentee Follow-Up Widget */}
                        <AbsenteeFollowUpWidget />

                        {/* Upcoming Celebrations Widget */}
                        <UpcomingCelebrationsWidget />

                        {/* Today's Agenda */}
                        <Card className="bg-card dark:bg-card-dark border border-slate-100 dark:border-dark p-6 rounded-3xl shadow-sm dark:shadow-none" title="Agenda du Jour">
                            <div className="mt-6 space-y-0">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : todayDepts.length > 0 ? todayDepts.slice(0, 5).map((dept, idx) => (
                                    <div
                                        key={dept.id}
                                        onClick={() => navigate(`/departments`)}
                                        className="relative flex gap-4 pb-6 last:pb-0 cursor-pointer hover:bg-slate-50 dark:bg-white/[0.02]/50 rounded-xl p-2 -m-2 transition-colors group"
                                    >
                                        {/* Timeline Line */}
                                        {idx !== todayDepts.length - 1 && (
                                            <div className="absolute left-[19px] top-8 bottom-0 w-px bg-slate-100"></div>
                                        )}

                                        {/* Time Badge */}
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-dark flex flex-col items-center justify-center z-10 text-primary dark:text-white group-hover:bg-primary group-hover:text-white transition-colors">
                                            {dept.meetingTime ? (
                                                <>
                                                    <span className="text-[10px] font-black leading-none">{dept.meetingTime.split(':')[0]}</span>
                                                    <span className="text-[9px] text-slate-400 leading-none mt-0.5 group-hover:text-white/80">{dept.meetingTime.split(':')[1]}</span>
                                                </>
                                            ) : (
                                                <span className="text-[9px] font-black">-</span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="pt-1 flex-1">
                                            <h4 className="text-sm font-bold text-primary dark:text-white group-hover:text-indigo-600 transition-colors">{dept.name}</h4>
                                            {dept.leaderName && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                    {dept.leaderName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-8 text-center text-slate-400">
                                        <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">Aucun événement aujourd'hui</p>
                                        <button
                                            onClick={() => navigate('/departments')}
                                            className="text-xs text-indigo-600 dark:text-indigo-300 hover:underline mt-2"
                                        >
                                            Voir les départements
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Latest Announcements */}
                        <Card
                            className="bg-card dark:bg-card-dark border border-slate-100 dark:border-dark p-6 rounded-3xl shadow-sm dark:shadow-none cursor-pointer hover:border-primary/20 dark:hover:border-darkHighlight transition-all"
                            title={`Annonces Récentes (${(announcements && Array.isArray(announcements) ? announcements : []).filter(a => {
                                if (!a.isActive || a.isArchived) return false;
                                const now = new Date();
                                const startDate = new Date(a.startDate);
                                const endDate = a.endDate ? new Date(a.endDate) : null;
                                return startDate <= now && (!endDate || endDate >= now);
                            }).length})`}
                            onClick={() => navigate('/announcements')}
                        >
                            <div className="mt-4 space-y-3">
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : (announcements && Array.isArray(announcements) ? announcements : []).filter(a => {
                                    if (!a.isActive || a.isArchived) return false;
                                    const now = new Date();
                                    const startDate = new Date(a.startDate);
                                    const endDate = a.endDate ? new Date(a.endDate) : null;
                                    return startDate <= now && (!endDate || endDate >= now);
                                }).slice(0, 3).length > 0 ? (
                                    (announcements && Array.isArray(announcements) ? announcements : []).filter(a => {
                                        if (!a.isActive || a.isArchived) return false;
                                        const now = new Date();
                                        const startDate = new Date(a.startDate);
                                        const endDate = a.endDate ? new Date(a.endDate) : null;
                                        return startDate <= now && (!endDate || endDate >= now);
                                    }).slice(0, 3).map(announcement => (
                                        <div
                                            key={announcement.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/announcements');
                                            }}
                                            className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-dark cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors group"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 line-clamp-1 flex-1">{announcement.title}</h4>
                                                <Badge className="bg-blue-500 text-white text-[9px] px-2 py-0.5">{announcement.category}</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">{announcement.content}</p>
                                            <p className="text-[9px] text-slate-400 mt-2">{new Date(announcement.startDate).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-xs">
                                        <FileTextIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p>Aucune annonce active</p>
                                        <p className="text-[10px] mt-2 text-slate-300">Cliquez pour voir toutes les annonces</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Action Items / Pendings */}
                        <Card
                            className="bg-card dark:bg-card-dark border border-slate-100 dark:border-dark p-6 rounded-3xl shadow-sm dark:shadow-none cursor-pointer hover:border-primary/20 dark:hover:border-darkHighlight transition-all"
                            title={`À Faire (${pendingTasks.length})`}
                            onClick={() => navigate('/assistant')}
                        >
                            <div className="mt-4 space-y-3">
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : pendingTasks.length > 0 ? (
                                    pendingTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateTask(task.id, 'Terminé');
                                            }}
                                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-dark cursor-pointer hover:bg-emerald-50 hover:border-emerald-100 transition-colors group"
                                        >
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'HIGH' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                            <p className="text-xs font-medium text-slate-700 dark:text-white flex-1 group-hover:text-emerald-700">{task.title}</p>
                                            <div className="w-4 h-4 rounded-full border border-slate-300 group-hover:bg-emerald-500 group-hover:border-emerald-500 flex items-center justify-center transition-all">
                                                <svg className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-xs">
                                        <FileTextIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p>Tout est à jour !</p>
                                        <p className="text-[10px] mt-2 text-slate-300">Cliquez pour voir l'assistant</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Saisie Rapide Fréquentation">
                    <form onSubmit={handleReportSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <Input label="Date" type="date" value={reportForm.date} onChange={e => setReportForm({ ...reportForm, date: e.target.value })} required className="rounded-xl py-3 text-sm" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Hommes" type="number" placeholder="0" value={reportForm.men} onChange={e => setReportForm({ ...reportForm, men: e.target.value })} required className="rounded-xl text-sm" />
                            <Input label="Femmes" type="number" placeholder="0" value={reportForm.women} onChange={e => setReportForm({ ...reportForm, women: e.target.value })} required className="rounded-xl text-sm" />
                            <Input label="Enfants" type="number" placeholder="0" value={reportForm.children} onChange={e => setReportForm({ ...reportForm, children: e.target.value })} required className="rounded-xl text-sm" />
                        </div>
                        <Button type="submit" isLoading={isReportSubmitting} disabled={isReportSubmitting} className="w-full py-4 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary-light transition-colors">Enregistrer</Button>
                    </form>
                </Modal>

                <Modal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} title="Saisie Rapide Offrande">
                    <form onSubmit={handleFinanceSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Montant</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={financeForm.amount}
                                    onChange={e => setFinanceForm({ ...financeForm, amount: e.target.value })}
                                    className="w-full text-3xl font-black text-primary dark:text-white border-none bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary/10"
                                    placeholder="0"
                                    autoFocus
                                />
                                <div className="absolute right-2 top-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFinanceForm(p => ({ ...p, currency: 'CDF' }))}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-black ${financeForm.currency === 'CDF' ? 'bg-primary text-white' : 'bg-card dark:bg-card-dark text-slate-400'}`}
                                    >CDF</button>
                                    <button
                                        type="button"
                                        onClick={() => setFinanceForm(p => ({ ...p, currency: 'USD' }))}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-black ${financeForm.currency === 'USD' ? 'bg-primary text-white' : 'bg-card dark:bg-card-dark text-slate-400'}`}
                                    >USD</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Type</label>
                                <select
                                    value={financeForm.type}
                                    onChange={e => setFinanceForm({ ...financeForm, type: e.target.value as any })}
                                    className="w-full p-4 bg-card dark:bg-card-dark border border-slate-200 dark:border-dark rounded-2xl text-xs font-bold outline-none"
                                >
                                    <option value="Offrande">Offrande</option>
                                    <option value="Dîme">Dîme</option>
                                    <option value="Action de grâce">Action de Grâce</option>
                                    <option value="Dons">Dons</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Compte</label>
                                <select
                                    value={financeForm.account}
                                    onChange={e => setFinanceForm({ ...financeForm, account: e.target.value as FinanceAccount })}
                                    className="w-full p-4 bg-card dark:bg-card-dark border border-slate-200 dark:border-dark rounded-2xl text-xs font-bold outline-none"
                                >
                                    <option value="Cash">Cash / Caisse</option>
                                    <option value="Rawbank">Rawbank</option>
                                    <option value="Equity">Equity BCDC</option>
                                    <option value="Mpesa">M-Pesa</option>
                                    <option value="OrangeMoney">Orange Money</option>
                                    <option value="PayPal">PayPal</option>
                                </select>
                            </div>
                        </div>

                        <Input label="Note (Optionnel)" value={financeForm.notes} onChange={e => setFinanceForm({ ...financeForm, notes: e.target.value })} placeholder="Détails..." className="my-2" />

                        <Button type="submit" isLoading={isFinanceSubmitting} disabled={isFinanceSubmitting} className="w-full py-4 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-colors shadow-lg dark:shadow-none shadow-emerald-200 dark:shadow-none">
                            Valider l'Offrande
                        </Button>
                    </form>
                </Modal>

                <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="Nouveau Fidèle">
                    <form onSubmit={handleMemberSubmit} className="space-y-6">
                        <Input
                            label="Nom Complet"
                            value={memberForm.name}
                            onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                            required
                            className="rounded-xl"
                            placeholder="Prénom et Nom"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Genre</label>
                                <select
                                    value={memberForm.gender}
                                    onChange={e => setMemberForm({ ...memberForm, gender: e.target.value as 'Homme' | 'Femme' })}
                                    className="w-full p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-dark rounded-xl text-sm font-medium outline-none"
                                >
                                    <option value="Homme">Homme</option>
                                    <option value="Femme">Femme</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Statut</label>
                                <select
                                    value={memberForm.status}
                                    onChange={e => setMemberForm({ ...memberForm, status: e.target.value as 'Fidèle' | 'Visiteur' | 'Archivé' })}
                                    className="w-full p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-dark rounded-xl text-sm font-medium outline-none"
                                >
                                    <option value="Fidèle">Fidèle</option>
                                    <option value="Visiteur">Visiteur</option>
                                    <option value="Archivé">Archivé</option>
                                </select>
                            </div>
                        </div>
                        <Input
                            label="Téléphone"
                            value={memberForm.phone}
                            onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
                            className="rounded-xl"
                            placeholder="+243..."
                        />
                        <Button type="submit" isLoading={isMemberSubmitting} disabled={isMemberSubmitting} className="w-full py-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors shadow-lg dark:shadow-none">
                            Enregistrer
                        </Button>
                    </form>
                </Modal>

                {/* AI Insight Modal */}
                <Modal
                    isOpen={!!aiInsight}
                    onClose={() => setAiInsight(null)}
                    title="Rapport Stratégique IA"
                    size="lg"
                >
                    {aiInsight && (
                        <div className="p-6 space-y-6">
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-[2rem] border border-indigo-100 mb-8">
                                <h3 className="text-xl font-display font-black text-indigo-900 dark:text-white mb-2 flex items-center">
                                    <SparklesIcon className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-300" />
                                    L'Intelligence Visionnaire
                                </h3>
                                <p className="text-sm text-indigo-700 dark:text-indigo-200 font-medium">Synthèse générée pour le commandement pastoral.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20/50 border border-emerald-100 p-5 rounded-2xl">
                                    <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-2 flex items-center">
                                        <HeartIcon className="w-4 h-4 mr-2" />
                                        Impact Spirituel
                                    </h4>
                                    <p className="text-slate-700 dark:text-white text-sm leading-relaxed font-medium">{aiInsight.impactSpirituel}</p>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20/50 border border-amber-100 p-5 rounded-2xl">
                                    <h4 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center">
                                        <TrendingUpIcon className="w-4 h-4 mr-2" />
                                        Vigilance Administrative
                                    </h4>
                                    <p className="text-slate-700 dark:text-white text-sm leading-relaxed font-medium">{aiInsight.vigilanceAdministrative}</p>
                                </div>

                                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 p-5 rounded-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -mr-10 -mt-10"></div>
                                    <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-100 uppercase tracking-widest mb-2 relative z-10 flex items-center">
                                        <SparklesIcon className="w-4 h-4 mr-2" />
                                        Focus Visionnaire
                                    </h4>
                                    <p className="text-indigo-900 dark:text-white text-sm leading-relaxed font-bold relative z-10">"{aiInsight.focusVisionnaire}"</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 mt-6 border-t border-slate-100 dark:border-dark">
                                <Button onClick={() => setAiInsight(null)} variant="primary">
                                    Terminé
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Sunday Quick Entry FAB */}
                <motion.button
                    onClick={() => setIsSundayEntryOpen(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="fixed bottom-24 md:bottom-8 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-indigo-800 dark:from-gold dark:to-amber-600 text-white dark:text-white shadow-lg shadow-primary/30 dark:shadow-gold/30 flex items-center justify-center group"
                    title="Saisie Rapide Culte"
                >
                    <PlusCircleIcon className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                </motion.button>

                <SundayQuickEntry
                    isOpen={isSundayEntryOpen}
                    onClose={() => setIsSundayEntryOpen(false)}
                />
            </div>
        </div>
    );
};

export default DashboardPage;
