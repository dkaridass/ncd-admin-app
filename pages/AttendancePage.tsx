import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PageTransition from '../components/layout/PageTransition';
import { UsersIcon, PlusCircleIcon, TrendingUpIcon, CalendarIcon, HeartIcon } from '../components/icons/Icons';
import { AttendanceRecord } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import AttendanceChart from '../components/analytics/AttendanceChart';

const AttendancePage: React.FC = () => {
    const { attendance, addAttendance, currentUser } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        sessionName: '1er Culte',
        serviceType: 'Ordinaire' as 'Ordinaire' | 'Spécial',
        specialServiceName: '',
        menCount: '',
        womenCount: '',
        childrenCount: '',
        youthCount: '',
        visitorCount: '',
        newConvertsCount: '',
        notes: ''
    });

    const [historyFilter, setHistoryFilter] = useState<'Tous' | 'Ordinaire' | 'Spécial'>('Tous');

    const cultesDisponibles = [
        '1er Culte', '2ème Culte', '3ème Culte',
        'École Biblique (Mercredi)',
        'Culte de Jeune, Prières, Délivrance (Vendredi)',
        'Séminaire', 'Autre'
    ];

    const specialServices = [
        'Noël', 'Pâques', 'Pentecôte', 'Convention', 'Croisade',
        'Retraite', 'Séminaire Spécial', 'Anniversaire Église',
        'Veillée de Prière', 'Baptême d\'eau', 'Sainte Cène', 'Autre'
    ];

    const calculateTotal = () => {
        return (parseInt(formData.menCount) || 0) +
            (parseInt(formData.womenCount) || 0) +
            (parseInt(formData.childrenCount) || 0) +
            (parseInt(formData.youthCount) || 0) +
            (parseInt(formData.visitorCount) || 0) +
            (parseInt(formData.newConvertsCount) || 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const total = calculateTotal();
            if (total === 0) {
                showError("Veuillez saisir au moins un effectif.");
                setIsSubmitting(false);
                return;
            }

            const sessionNameToUse = formData.serviceType === 'Spécial'
                ? (formData.specialServiceName || 'Culte Spécial')
                : formData.sessionName;

            // I2 fix: Prevent duplicate attendance for same date+session
            const exists = attendance.find(a => a.date === formData.date && a.sessionName === sessionNameToUse);
            if (exists) {
                showError(`Un rapport existe déjà pour ${sessionNameToUse} le ${new Date(formData.date).toLocaleDateString('fr-FR')}. Modifiez-le plutôt.`);
                setIsSubmitting(false);
                return;
            }

            // Build record — Firestore rejects undefined values, so only include defined fields
            const record: any = {
                date: formData.date,
                sessionName: sessionNameToUse,
                serviceType: formData.serviceType,
                menCount: parseInt(formData.menCount) || 0,
                womenCount: parseInt(formData.womenCount) || 0,
                childrenCount: parseInt(formData.childrenCount) || 0,
                youthCount: parseInt(formData.youthCount) || 0,
                visitorCount: parseInt(formData.visitorCount) || 0,
                newConvertsCount: parseInt(formData.newConvertsCount) || 0,
                totalCount: total,
                notes: formData.notes || ''
            };
            if (formData.serviceType === 'Spécial' && formData.specialServiceName) {
                record.specialServiceName = formData.specialServiceName;
            }

            await addAttendance(record);

            showSuccess("✅ Rapport de présence enregistré !");
            setIsModalOpen(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                sessionName: '1er Culte',
                serviceType: 'Ordinaire',
                specialServiceName: '',
                menCount: '',
                womenCount: '',
                childrenCount: '',
                youthCount: '',
                visitorCount: '',
                newConvertsCount: '',
                notes: ''
            });
        } catch (error: any) {
            console.error("Error saving attendance:", error);
            showError("Erreur lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortedRecords = [...(attendance || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const filteredRecords = historyFilter === 'Tous' ? sortedRecords
        : sortedRecords.filter(r => (r.serviceType || 'Ordinaire') === historyFilter);

    const specialServicesThisYear = sortedRecords.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === new Date().getFullYear() && (r.serviceType === 'Spécial');
    });
    const totalNewConverts = sortedRecords.reduce((sum, r) => sum + (r.newConvertsCount || 0), 0);

    return (
        <PageTransition>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
                <div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-primary dark:text-white font-display tracking-tight leading-none mb-1 uppercase italic">Présences</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic opacity-80 uppercase tracking-widest text-[9px]">Suivi des Cultes • NCD La Pentecôte</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="rounded-xl px-6 py-4 bg-primary text-white text-[10px] uppercase font-black tracking-widest shadow-lg dark:shadow-none hover:scale-105 transition-transform">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Nouveau Rapport
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg dark:shadow-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <UsersIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Total Fidèles (Mois)</h3>
                    <p className="text-4xl font-black font-display tracking-tight">
                        {sortedRecords.slice(0, 4).reduce((acc, r) => acc + r.totalCount, 0).toLocaleString()}
                    </p>
                </Card>
                <Card className="p-6 bg-card dark:bg-card-dark border border-slate-100 dark:border-dark shadow-sm dark:shadow-none">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Dernier Culte</h3>
                    {sortedRecords[0] ? (
                        <div>
                            <p className="text-3xl font-black text-slate-800 dark:text-white font-display mb-1">{sortedRecords[0].totalCount}</p>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{sortedRecords[0].sessionName} • {new Date(sortedRecords[0].date).toLocaleDateString('fr-FR')}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 font-medium">Aucune donnée</p>
                    )}
                </Card>
                <Card className="p-6 bg-card dark:bg-card-dark border border-slate-100 dark:border-dark shadow-sm dark:shadow-none">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Tendances</h3>
                    {(() => {
                        // I3 fix: Calculate real attendance trend
                        const now = new Date();
                        const thisMonth = sortedRecords.filter(r => {
                            const d = new Date(r.date);
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        });
                        const lastMonth = sortedRecords.filter(r => {
                            const d = new Date(r.date);
                            const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                            const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
                        });
                        const thisAvg = thisMonth.length > 0 ? thisMonth.reduce((a, r) => a + r.totalCount, 0) / thisMonth.length : 0;
                        const lastAvg = lastMonth.length > 0 ? lastMonth.reduce((a, r) => a + r.totalCount, 0) / lastMonth.length : 0;
                        const trendPct = lastAvg > 0 ? Math.round(((thisAvg - lastAvg) / lastAvg) * 100) : 0;
                        const isUp = trendPct >= 0;
                        return (
                            <div className={`flex items-center gap-2 ${isUp ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50 dark:bg-red-900/20'} px-3 py-1 rounded-lg w-fit`}>
                                <TrendingUpIcon className={`w-4 h-4 ${!isUp ? 'rotate-180' : ''}`} />
                                <span className="text-xs font-bold">{isUp ? '+' : ''}{trendPct}% vs mois dernier</span>
                            </div>
                        );
                    })()}
                </Card>
            </div>

            {/* Special Services Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg dark:shadow-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CalendarIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Cultes Spéciaux (Année)</h3>
                    <p className="text-4xl font-black font-display tracking-tight">{specialServicesThisYear.length}</p>
                    <p className="text-xs font-bold opacity-70 mt-1">
                        {specialServicesThisYear.length > 0 ? specialServicesThisYear.map(s => s.specialServiceName || s.sessionName).slice(0, 3).join(', ') + (specialServicesThisYear.length > 3 ? '...' : '') : 'Aucun cette année'}
                    </p>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg dark:shadow-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <HeartIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Nouvelles Conversions (Total)</h3>
                    <p className="text-4xl font-black font-display tracking-tight">{totalNewConverts}</p>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="mb-8 h-96">
                <AttendanceChart />
            </div>

            {/* Attendance List */}
            <div className="bg-card dark:bg-card-dark rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-dark overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-dark bg-slate-50 dark:bg-white/[0.02]/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h3 className="font-bold text-slate-700 dark:text-white">Historique des Rapports</h3>
                    <div className="flex gap-2 bg-card dark:bg-card-dark rounded-full p-1 shadow-sm dark:shadow-none border border-slate-100 dark:border-dark">
                        {(['Tous', 'Ordinaire', 'Spécial'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setHistoryFilter(f)}
                                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all ${historyFilter === f ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Mobile Card List View */}
                <div className="md:hidden flex flex-col divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredRecords.map((record) => (
                        <div key={record.id} className="p-5 flex flex-col gap-4 bg-card dark:bg-card-dark hover:bg-slate-50/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[11px] font-black uppercase text-slate-400 mb-2">
                                        {new Date(record.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                    <span className={`px-2 py-1 flex items-center gap-1.5 rounded-md text-xs font-bold w-fit ${record.sessionName.includes('1er') ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' : record.sessionName.includes('2ème') ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        <CalendarIcon className="w-3 h-3" />
                                        {record.sessionName}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1">Total</p>
                                    <span className="inline-flex items-center justify-center min-w-[3rem] h-8 px-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white font-black text-base shadow-sm">
                                        {record.totalCount}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-dark">
                                <div className="flex-1 text-center">
                                    <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 mb-1">H</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{record.menCount}</p>
                                </div>
                                <div className="w-px h-6 bg-slate-200 dark:bg-dark"></div>
                                <div className="flex-1 text-center">
                                    <p className="text-[9px] font-black text-pink-500 dark:text-pink-400 mb-1">F</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{record.womenCount}</p>
                                </div>
                                <div className="w-px h-6 bg-slate-200 dark:bg-dark"></div>
                                <div className="flex-1 text-center">
                                    <p className="text-[9px] font-black text-purple-500 dark:text-purple-400 mb-1">J</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{record.youthCount || '-'}</p>
                                </div>
                                <div className="w-px h-6 bg-slate-200 dark:bg-dark"></div>
                                <div className="flex-1 text-center">
                                    <p className="text-[9px] font-black text-orange-500 dark:text-orange-400 mb-1">E</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{record.childrenCount}</p>
                                </div>
                                <div className="w-px h-6 bg-slate-200 dark:bg-dark"></div>
                                <div className="flex-1 text-center">
                                    <p className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 mb-1">V</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{record.visitorCount || '-'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredRecords.length === 0 && (
                        <div className="p-12 text-center opacity-40">
                            <UsersIcon className="w-10 h-10 mx-auto mb-3" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                Aucun rapport enregistré
                            </p>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-dark">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Session</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-blue-500">H</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-pink-500">F</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-purple-500">J</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-orange-500">E</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-500">V</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50 dark:bg-white/[0.02]/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-white">
                                        {new Date(record.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${record.sessionName.includes('1er') ? 'bg-blue-50 text-blue-600' : record.sessionName.includes('2ème') ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500 dark:text-slate-400'}`}>
                                            {record.sessionName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-800 dark:text-white font-black text-sm">
                                            {record.totalCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{record.menCount}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{record.womenCount}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{record.youthCount || '-'}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{record.childrenCount}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{record.visitorCount || '-'}</td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Aucun rapport de présence enregistré.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Rapport de Présence">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Service Type Toggle */}
                    <div className="flex gap-2 bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-1.5 border border-slate-100 dark:border-dark">
                        {(['Ordinaire', 'Spécial'] as const).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setFormData({ ...formData, serviceType: t })}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.serviceType === t
                                    ? t === 'Spécial'
                                        ? 'bg-amber-500 text-white shadow-lg'
                                        : 'bg-primary text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {t === 'Ordinaire' ? '⛪ Culte Ordinaire' : '⭐ Culte Spécial'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                        {formData.serviceType === 'Ordinaire' ? (
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Session</label>
                                <select
                                    value={formData.sessionName}
                                    onChange={e => setFormData({ ...formData, sessionName: e.target.value })}
                                    className="block w-full px-4 py-3 border-2 border-slate-200 dark:border-dark rounded-xl bg-slate-50 dark:bg-white/[0.02] font-bold text-sm text-slate-700 dark:text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                >
                                    {cultesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-[10px] font-black text-amber-500 mb-2 uppercase tracking-widest">⭐ Service Spécial</label>
                                <select
                                    value={formData.specialServiceName}
                                    onChange={e => setFormData({ ...formData, specialServiceName: e.target.value })}
                                    className="block w-full px-4 py-3 border-2 border-amber-300 dark:border-amber-800 rounded-xl bg-amber-50 dark:bg-amber-900/10 font-bold text-sm text-amber-800 dark:text-amber-300 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                                    required
                                >
                                    <option value="">Sélectionner...</option>
                                    {specialServices.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { label: 'Hommes', field: 'menCount', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' },
                            { label: 'Femmes', field: 'womenCount', color: 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800' },
                            { label: 'Jeunes', field: 'youthCount', color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' },
                            { label: 'Enfants', field: 'childrenCount', color: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' },
                            { label: 'Visiteurs', field: 'visitorCount', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' },
                            { label: 'Conversions', field: 'newConvertsCount', color: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800' }
                        ].map((item) => (
                            <div key={item.field} className={`flex flex-col items-center p-4 rounded-2xl border-2 ${item.color}`}>
                                <label className="text-[10px] font-black uppercase tracking-widest mb-3">{item.label}</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    value={formData[item.field as keyof typeof formData]}
                                    onChange={e => setFormData({ ...formData, [item.field]: e.target.value })}
                                    className="w-full text-center text-3xl font-black font-display bg-white dark:bg-card-dark rounded-xl py-3 border-2 border-transparent focus:border-current outline-none transition-all text-slate-800 dark:text-white placeholder-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="0"
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, [item.field]: Math.max(0, (parseInt(prev[item.field as keyof typeof prev] as string) || 0) - 1).toString() }))}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/80 dark:bg-dark text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-bold"
                                    >
                                        −
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, [item.field]: ((parseInt(prev[item.field as keyof typeof prev] as string) || 0) + 1).toString() }))}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/80 dark:bg-dark text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-dark flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Calculé</span>
                        <span className="text-2xl font-black text-primary dark:text-white font-display">{calculateTotal()}</span>
                    </div>

                    <Input label="Notes (Optionnel)" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Remarques particulières..." />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button type="submit" isLoading={isSubmitting}>Enregistrer</Button>
                    </div>
                </form>
            </Modal>
        </PageTransition>
    );
};

export default AttendancePage;
