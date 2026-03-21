
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { AttendanceRecord, FinanceRecord, FinanceAccount, TransactionType, Currency } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import AnimatedCounter from '../ui/AnimatedCounter';
import { UsersIcon, DollarSignIcon, CalendarIcon } from '../icons/Icons';
import { showSuccess, showError } from '../../utils/toast';

interface SundayQuickEntryProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'service' | 'attendance' | 'offering' | 'summary';

interface OfferingLine {
    id: number;
    type: TransactionType;
    amount: string;
    currency: Currency;
    account: FinanceAccount;
}

const serviceOptions = [
    { value: '1er Culte (Dim)', label: '1er Culte', time: '08h00', icon: '🌅' },
    { value: '2ème Culte (Dim)', label: '2ème Culte', time: '11h00', icon: '☀️' },
    { value: '3ème Culte (Dim)', label: '3ème Culte', time: '16h00', icon: '🌇' },
    { value: 'Culte Mercredi', label: 'Culte Mercredi', time: '18h00', icon: '📖' },
    { value: 'Culte Vendredi', label: 'Culte Vendredi', time: '18h00', icon: '🙏' },
];

const SundayQuickEntry: React.FC<SundayQuickEntryProps> = ({ isOpen, onClose }) => {
    const { addAttendance, addFinanceRecord, currentUser } = useData();

    const [step, setStep] = useState<Step>('service');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1: Service
    const [selectedService, setSelectedService] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Step 2: Attendance
    const [attForm, setAttForm] = useState({
        men: '',
        women: '',
        children: '',
        visitors: '',
    });

    // Step 3: Offerings
    const [offerings, setOfferings] = useState<OfferingLine[]>([
        { id: 1, type: 'Offrande', amount: '', currency: 'CDF', account: 'Cash' },
    ]);

    const totalAttendance = (parseInt(attForm.men) || 0) + (parseInt(attForm.women) || 0) + (parseInt(attForm.children) || 0);

    const addOfferingLine = () => {
        setOfferings(prev => [
            ...prev,
            { id: Date.now(), type: 'Offrande', amount: '', currency: 'CDF', account: 'Cash' },
        ]);
    };

    const removeOfferingLine = (id: number) => {
        if (offerings.length > 1) {
            setOfferings(prev => prev.filter(o => o.id !== id));
        }
    };

    const updateOffering = (id: number, field: keyof OfferingLine, value: any) => {
        setOfferings(prev =>
            prev.map(o => (o.id === id ? { ...o, [field]: value } : o))
        );
    };

    const totalOfferingsCDF = offerings
        .filter(o => o.currency === 'CDF')
        .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);

    const totalOfferingsUSD = offerings
        .filter(o => o.currency === 'USD')
        .reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // 1. Save attendance
            const attendanceRecord: Omit<AttendanceRecord, 'id'> = {
                date,
                sessionName: selectedService,
                menCount: parseInt(attForm.men) || 0,
                womenCount: parseInt(attForm.women) || 0,
                childrenCount: parseInt(attForm.children) || 0,
                visitorCount: parseInt(attForm.visitors) || 0,
                totalCount: totalAttendance,
            };
            await addAttendance(attendanceRecord as AttendanceRecord);

            // 2. Save each offering line
            const validOfferings = offerings.filter(o => parseFloat(o.amount) > 0);
            for (const o of validOfferings) {
                const financeRecord: Omit<FinanceRecord, 'id'> = {
                    type: o.type,
                    amount: parseFloat(o.amount),
                    currency: o.currency,
                    account: o.account,
                    date,
                    serviceName: selectedService,
                    recordedBy: currentUser?.name || 'Admin',
                    isApproved: true,
                    notes: `Saisie rapide dimanche — ${selectedService}`,
                };
                await addFinanceRecord(financeRecord);
            }

            showSuccess(`✅ Culte enregistré : ${totalAttendance} présents, ${validOfferings.length} offrandes`);
            resetAndClose();
        } catch (error: any) {
            showError(`Erreur: ${error?.message || 'Erreur inconnue'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAndClose = () => {
        setStep('service');
        setSelectedService('');
        setDate(new Date().toISOString().split('T')[0]);
        setAttForm({ men: '', women: '', children: '', visitors: '' });
        setOfferings([{ id: 1, type: 'Offrande', amount: '', currency: 'CDF', account: 'Cash' }]);
        onClose();
    };

    const canProceedFromService = selectedService && date;
    const canProceedFromAttendance = totalAttendance > 0;

    const steps: { key: Step; label: string; num: number }[] = [
        { key: 'service', label: 'Culte', num: 1 },
        { key: 'attendance', label: 'Présences', num: 2 },
        { key: 'offering', label: 'Offrandes', num: 3 },
        { key: 'summary', label: 'Résumé', num: 4 },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            >
                {/* Backdrop */}
                <div onClick={resetAndClose} className="absolute inset-0 bg-primary/40 dark:bg-black/60 backdrop-blur-sm" />

                {/* Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card dark:bg-card-dark rounded-[2rem] shadow-2xl dark:shadow-none w-full max-w-lg overflow-hidden relative z-10 border border-slate-100 dark:border-slate-700"
                >
                    {/* Header */}
                    <div className="px-8 pt-6 pb-4 border-b border-slate-50 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary dark:text-gold">
                                ⚡ Saisie Rapide Culte
                            </h2>
                            <button
                                onClick={resetAndClose}
                                className="text-slate-300 dark:text-slate-600 hover:text-primary dark:hover:text-white transition-colors text-2xl font-light"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex items-center gap-1">
                            {steps.map((s, i) => (
                                <React.Fragment key={s.key}>
                                    <div
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${i <= currentStepIndex ? 'bg-primary/10 dark:bg-gold/10 text-primary dark:text-gold' : 'text-slate-300 dark:text-slate-600' }`}
                                    >
                                        <span
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${i < currentStepIndex ? 'bg-emerald-500 text-white' : i === currentStepIndex ? 'bg-primary dark:bg-gold text-white dark:text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400' }`}
                                        >
                                            {i < currentStepIndex ? '✓' : s.num}
                                        </span>
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`flex-1 h-px ${i < currentStepIndex ? 'bg-emerald-300 dark:bg-emerald-600' : 'bg-slate-100 dark:bg-slate-700'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 max-h-[60vh] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Service Selection */}
                            {step === 'service' && (
                                <motion.div
                                    key="service"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">
                                            Date du Culte
                                        </label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary dark:focus:border-gold focus:ring-2 focus:ring-primary/20 dark:focus:ring-gold/20 outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">
                                            Quel culte ?
                                        </label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {serviceOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setSelectedService(option.value)}
                                                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedService === option.value ? 'border-primary dark:border-gold bg-primary/5 dark:bg-gold/5 shadow-sm dark:shadow-none' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600' }`}
                                                >
                                                    <span className="text-2xl">{option.icon}</span>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-bold ${selectedService === option.value ? 'text-primary dark:text-gold' : 'text-slate-700 dark:text-slate-200'}`}>
                                                            {option.label}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{option.time}</p>
                                                    </div>
                                                    {selectedService === option.value && (
                                                        <div className="w-6 h-6 rounded-full bg-primary dark:bg-gold flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-white dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Attendance */}
                            {step === 'attendance' && (
                                <motion.div
                                    key="attendance"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center mb-6">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-full">
                                            <UsersIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Présences — {selectedService}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">👨 Hommes</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={attForm.men}
                                                onChange={e => setAttForm(p => ({ ...p, men: e.target.value }))}
                                                className="w-full text-center text-2xl font-black text-primary dark:text-white p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-white/5 outline-none focus:border-primary dark:focus:border-gold transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">👩 Femmes</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={attForm.women}
                                                onChange={e => setAttForm(p => ({ ...p, women: e.target.value }))}
                                                className="w-full text-center text-2xl font-black text-primary dark:text-white p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-white/5 outline-none focus:border-primary dark:focus:border-gold transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">👶 Enfants</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={attForm.children}
                                                onChange={e => setAttForm(p => ({ ...p, children: e.target.value }))}
                                                className="w-full text-center text-2xl font-black text-primary dark:text-white p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-white/5 outline-none focus:border-primary dark:focus:border-gold transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">🙋 Visiteurs</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={attForm.visitors}
                                                onChange={e => setAttForm(p => ({ ...p, visitors: e.target.value }))}
                                                className="w-full text-center text-2xl font-black text-primary dark:text-white p-4 border-2 border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-white/5 outline-none focus:border-primary dark:focus:border-gold transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Live Total */}
                                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Présents</p>
                                        <p className="text-4xl font-display font-black text-emerald-700 dark:text-emerald-300">
                                            <AnimatedCounter value={totalAttendance} />
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Offerings */}
                            {step === 'offering' && (
                                <motion.div
                                    key="offering"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="text-center mb-4">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-full">
                                            <DollarSignIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Offrandes & Dîmes</span>
                                        </div>
                                    </div>

                                    {offerings.map((o, idx) => (
                                        <div key={o.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                    Ligne {idx + 1}
                                                </span>
                                                {offerings.length > 1 && (
                                                    <button
                                                        onClick={() => removeOfferingLine(o.id)}
                                                        className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-wider"
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <select
                                                    value={o.type}
                                                    onChange={e => updateOffering(o.id, 'type', e.target.value)}
                                                    className="p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 outline-none"
                                                >
                                                    <option value="Offrande">Offrande</option>
                                                    <option value="Dîme">Dîme</option>
                                                    <option value="Action de grâce">Action de Grâce</option>
                                                    <option value="Offrande du prophète">Off. Prophète</option>
                                                    <option value="Dons">Dons</option>
                                                </select>
                                                <select
                                                    value={o.account}
                                                    onChange={e => updateOffering(o.id, 'account', e.target.value)}
                                                    className="p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 outline-none"
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="Rawbank">Rawbank</option>
                                                    <option value="Equity">Equity</option>
                                                    <option value="Mpesa">M-Pesa</option>
                                                    <option value="OrangeMoney">Orange Money</option>
                                                </select>
                                            </div>

                                            <div className="flex gap-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={o.amount}
                                                    onChange={e => updateOffering(o.id, 'amount', e.target.value)}
                                                    className="flex-1 text-lg font-black text-primary dark:text-white p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-white/5 outline-none focus:border-primary dark:focus:border-gold transition-all"
                                                    placeholder="Montant"
                                                />
                                                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateOffering(o.id, 'currency', 'CDF')}
                                                        className={`px-3 py-2 text-[10px] font-black transition-colors ${o.currency === 'CDF' ? 'bg-primary dark:bg-gold text-white dark:text-white' : 'bg-white dark:bg-white/5 text-slate-400' }`}
                                                    >
                                                        CDF
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateOffering(o.id, 'currency', 'USD')}
                                                        className={`px-3 py-2 text-[10px] font-black transition-colors ${o.currency === 'USD' ? 'bg-primary dark:bg-gold text-white dark:text-white' : 'bg-white dark:bg-white/5 text-slate-400' }`}
                                                    >
                                                        USD
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addOfferingLine}
                                        className="w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:border-primary dark:hover:border-gold hover:text-primary dark:hover:text-gold transition-all"
                                    >
                                        + Ajouter une ligne
                                    </button>
                                </motion.div>
                            )}

                            {/* Step 4: Summary */}
                            {step === 'summary' && (
                                <motion.div
                                    key="summary"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                            <span className="text-3xl">✅</span>
                                        </div>
                                        <h3 className="text-lg font-display font-bold text-primary dark:text-white mb-1">Vérification</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Confirmez les données avant envoi</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Culte</p>
                                            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{selectedService} — {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>

                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Présences</p>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">👨 {attForm.men || 0} · 👩 {attForm.women || 0} · 👶 {attForm.children || 0} · 🙋 {attForm.visitors || 0}</span>
                                                <span className="font-black text-indigo-700 dark:text-indigo-300">{totalAttendance}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                                            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">Offrandes</p>
                                            {offerings.filter(o => parseFloat(o.amount) > 0).map((o, idx) => (
                                                <div key={o.id} className="flex justify-between text-sm mb-1">
                                                    <span className="text-slate-600 dark:text-slate-400">{o.type} ({o.account})</span>
                                                    <span className="font-bold text-amber-700 dark:text-amber-300">{parseFloat(o.amount).toLocaleString()} {o.currency}</span>
                                                </div>
                                            ))}
                                            <div className="border-t border-amber-200 dark:border-amber-500/30 mt-2 pt-2 flex justify-between text-sm">
                                                <span className="font-black text-amber-600 dark:text-amber-400">Totaux</span>
                                                <div className="text-right">
                                                    {totalOfferingsCDF > 0 && <p className="font-black text-amber-700 dark:text-amber-300">FC {totalOfferingsCDF.toLocaleString()}</p>}
                                                    {totalOfferingsUSD > 0 && <p className="font-black text-amber-700 dark:text-amber-300">${totalOfferingsUSD.toLocaleString()}</p>}
                                                    {totalOfferingsCDF === 0 && totalOfferingsUSD === 0 && <p className="text-slate-400">Aucune offrande</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-5 border-t border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
                        {step !== 'service' ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const prevSteps: Record<Step, Step> = { service: 'service', attendance: 'service', offering: 'attendance', summary: 'offering' };
                                    setStep(prevSteps[step]);
                                }}
                                className="text-slate-500 dark:text-slate-400"
                            >
                                ← Retour
                            </Button>
                        ) : (
                            <div />
                        )}

                        {step === 'service' && (
                            <Button
                                onClick={() => setStep('attendance')}
                                disabled={!canProceedFromService}
                                className="ml-auto"
                            >
                                Présences →
                            </Button>
                        )}

                        {step === 'attendance' && (
                            <Button
                                onClick={() => setStep('offering')}
                                disabled={!canProceedFromAttendance}
                                className="ml-auto"
                            >
                                Offrandes →
                            </Button>
                        )}

                        {step === 'offering' && (
                            <Button
                                onClick={() => setStep('summary')}
                                className="ml-auto"
                            >
                                Vérifier →
                            </Button>
                        )}

                        {step === 'summary' && (
                            <Button
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                                className="ml-auto bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-500/20"
                            >
                                ✓ Enregistrer le Culte
                            </Button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SundayQuickEntry;
