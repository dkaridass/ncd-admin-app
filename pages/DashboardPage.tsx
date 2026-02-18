
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
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
    const { addAttendance, addFinanceRecord, addMember, updateTask, currentUser, isLoading, hasPermission } = dataContext;
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsight, setAiInsight] = useState<any | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isFinanceSubmitting, setIsFinanceSubmitting] = useState(false);
    const [isMemberSubmitting, setIsMemberSubmitting] = useState(false);
    const [isReportSubmitting, setIsReportSubmitting] = useState(false);
    const [isFixingRole, setIsFixingRole] = useState(false);

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
                totalMembers: (members && Array.isArray(members) ? members.length : 0),
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
                {/* Header: Title & Quick Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-serif font-medium text-primary mb-1">Tableau de Bord</h1>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            Administration Connectée
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Vision button removed - image recognition not needed for admin app */}
                    </div>
                </div>

                {/* SUPER ADMIN BOOTSTRAP BANNER - Only visible to admin@ncd.com who is NOT yet SUPER_ADMIN */}
                {isCurrentUserSuperAdminEmail() && currentUser?.role !== 'SUPER_ADMIN' && (
                    <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl animate-fade-in">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
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
                                    className="bg-white text-indigo-600 font-black text-sm px-8 py-3 rounded-xl hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all"
                                >
                                    🔐 Activer SUPER_ADMIN Maintenant
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Strategic Pulse */}
                <div className="mb-0">
                    <MorningPulseCard />
                </div>

                {/* Quick Actions Bar (New Position) */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                    <Button
                        onClick={() => setIsReportModalOpen(true)}
                        variant="white"
                        className="!bg-white !text-slate-700 !border-slate-200 hover:!border-primary hover:!text-primary shadow-sm text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                    >
                        <PlusCircleIcon className="w-4 h-4 mr-2" />
                        Culte
                    </Button>
                    <Button
                        onClick={() => setIsMemberModalOpen(true)}
                        variant="white"
                        className="!bg-white !text-slate-700 !border-slate-200 hover:!border-primary hover:!text-primary shadow-sm text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                    >
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Fidèle
                    </Button>
                    <Button
                        onClick={() => openFinanceModal()}
                        variant="white"
                        className="!bg-white !text-slate-700 !border-slate-200 hover:!border-primary hover:!text-primary shadow-sm text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                    >
                        <DollarSignIcon className="w-4 h-4 mr-2" />
                        Offrande
                    </Button>
                </div>

                {/* Top KPI Row — finance cards only for users with VIEW_FINANCES */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {([
                        {
                            label: 'Total Membres',
                            value: isLoading ? '...' : members.length,
                            icon: UsersIcon,
                            trend: isLoading ? '...' : `${memberTrend.isUp ? '+' : ''}${memberTrend.percent}%`,
                            trendUp: memberTrend.isUp,
                            onClick: () => navigate('/members'),
                            isFinance: false
                        },
                        {
                            label: 'Dernier Culte',
                            value: isLoading ? '...' : (lastSession?.totalCount || '-'),
                            icon: UsersIcon,
                            trend: isLoading ? '...' : `${trendValue > 0 ? '+' : ''}${trendPercent}%`,
                            trendUp: trendValue >= 0,
                            onClick: () => navigate('/events'),
                            isFinance: false
                        },
                        {
                            label: 'Recettes (USD)',
                            value: isLoading ? '...' : `$${totalUSD.toLocaleString()}`,
                            icon: DollarSignIcon,
                            trend: isLoading ? '...' : `${financeTrends.usd.isUp ? '+' : ''}${financeTrends.usd.percent}%`,
                            trendUp: financeTrends.usd.isUp,
                            isFinance: true,
                            onClick: () => navigate('/finances')
                        },
                        {
                            label: 'Recettes (CDF)',
                            value: isLoading ? '...' : `FC ${totalCDF.toLocaleString()}`,
                            icon: DollarSignIcon,
                            trend: isLoading ? '...' : `${financeTrends.cdf.isUp ? '+' : ''}${financeTrends.cdf.percent}%`,
                            trendUp: financeTrends.cdf.isUp,
                            isFinance: true,
                            onClick: () => navigate('/finances')
                        }
                    ] as const).filter(stat => !stat.isFinance || (hasPermission && hasPermission('VIEW_FINANCES'))).map((stat, i) => (
                        <Card
                            key={i}
                            onClick={stat.onClick}
                            className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <div className={`p-2 rounded-lg ${stat.isFinance ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-display font-bold text-primary">{stat.value}</h3>
                                <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.trendUp === true ? 'bg-emerald-50 text-emerald-600' : stat.trendUp === false ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                                    {stat.trendUp === true && <TrendingUpIcon className="w-3 h-3 mr-1" />}
                                    {stat.trend}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Account Balances Strip */}
                {hasPermission && hasPermission('VIEW_FINANCES') && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-700 mb-4 px-2">Soldes des Comptes</h3>
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
                    </div>

                    {/* Right Column: Agenda & Actions (1/3) */}
                    <div className="space-y-8">
                        {/* Today's Agenda */}
                        <Card className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm" title="Agenda du Jour">
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
                                        className="relative flex gap-4 pb-6 last:pb-0 cursor-pointer hover:bg-slate-50/50 rounded-xl p-2 -m-2 transition-colors group"
                                    >
                                        {/* Timeline Line */}
                                        {idx !== todayDepts.length - 1 && (
                                            <div className="absolute left-[19px] top-8 bottom-0 w-px bg-slate-100"></div>
                                        )}

                                        {/* Time Badge */}
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center z-10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
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
                                            <h4 className="text-sm font-bold text-primary group-hover:text-indigo-600 transition-colors">{dept.name}</h4>
                                            {dept.leaderName && (
                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
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
                                            className="text-xs text-indigo-600 hover:underline mt-2"
                                        >
                                            Voir les départements
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Latest Announcements */}
                        <Card
                            className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm cursor-pointer hover:border-primary/20 transition-all"
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
                                            className="p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors group"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 line-clamp-1 flex-1">{announcement.title}</h4>
                                                <Badge className="bg-blue-500 text-white text-[9px] px-2 py-0.5">{announcement.category}</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-600 line-clamp-2 mt-1">{announcement.content}</p>
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
                            className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm cursor-pointer hover:border-primary/20 transition-all"
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
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-emerald-50 hover:border-emerald-100 transition-colors group"
                                        >
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'HIGH' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                            <p className="text-xs font-medium text-slate-700 flex-1 group-hover:text-emerald-700">{task.title}</p>
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
                                    className="w-full text-3xl font-black text-primary border-none bg-slate-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary/10"
                                    placeholder="0"
                                    autoFocus
                                />
                                <div className="absolute right-2 top-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFinanceForm(p => ({ ...p, currency: 'CDF' }))}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-black ${financeForm.currency === 'CDF' ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}
                                    >CDF</button>
                                    <button
                                        type="button"
                                        onClick={() => setFinanceForm(p => ({ ...p, currency: 'USD' }))}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-black ${financeForm.currency === 'USD' ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}
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
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none"
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
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none"
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

                        <Button type="submit" isLoading={isFinanceSubmitting} disabled={isFinanceSubmitting} className="w-full py-4 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-200">
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
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
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
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
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
                        <Button type="submit" isLoading={isMemberSubmitting} disabled={isMemberSubmitting} className="w-full py-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">
                            Enregistrer
                        </Button>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default DashboardPage;
