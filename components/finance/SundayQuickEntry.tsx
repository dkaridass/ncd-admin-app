
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
    { value: '1er Culte (Dim)', label: '1er Culte', time: '08h00' },
    { value: '2ème Culte (Dim)', label: '2ème Culte', time: '11h00' },
    { value: '3ème Culte (Dim)', label: '3ème Culte', time: '16h00' },
    { value: 'Culte Mercredi', label: 'Culte Mercredi', time: '18h00' },
    { value: 'Culte Vendredi', label: 'Culte Vendredi', time: '18h00' },
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
                serviceType: selectedService.includes('Séminaire') || selectedService.includes('Convention') ? 'Spécial' : 'Culte',
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

            showSuccess(`Culte enregistré : ${totalAttendance} présents, ${validOfferings.length} lignes d'offrandes.`);
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
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 "
            >
                {/* Backdrop handler */}
                <div onClick={resetAndClose} className="absolute inset-0" />

                {/* Main Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="bg-white rounded-lg shadow-admin w-full max-w-xl overflow-hidden relative z-10 border border-border"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center justify-between">
                        <h2 className="text-sm font-bold tracking-wide text-slate-800 uppercase">
                            Saisie Rapide : Culte
                        </h2>
                        <button
                            onClick={resetAndClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none font-light p-1"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Progress Steps Header */}
                    <div className="px-6 py-3 border-b border-border bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2 w-full">
                            {steps.map((s, i) => (
                                <React.Fragment key={s.key}>
                                    <div className="flex items-center gap-2 relative">
                                        <div
                                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border transition-colors ${i < currentStepIndex
                                                ? 'bg-primary border-primary text-white'
                                                : i === currentStepIndex
                                                    ? 'bg-slate-800 border-slate-800 text-white'
                                                    : 'bg-white border-slate-200 text-slate-400'
                                                }`}
                                        >
                                            {i < currentStepIndex ? '✓' : s.num}
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold tracking-widest hidden sm:block ${i <= currentStepIndex ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`flex-1 h-px ${i < currentStepIndex ? 'bg-primary' : 'bg-slate-200'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Service Selection */}
                            {step === 'service' && (
                                <motion.div
                                    key="service"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                                            Date de Saisie
                                        </label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-border rounded text-sm text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                                            Sélection du Culte
                                        </label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {serviceOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setSelectedService(option.value)}
                                                    className={`flex items-center justify-between p-3 rounded border transition-all text-left ${selectedService === option.value ? 'border-primary bg-blue-50/50' : 'border-border hover:border-slate-300 bg-white'}`}
                                                >
                                                    <div>
                                                        <p className={`text-sm font-semibold ${selectedService === option.value ? 'text-primary' : 'text-slate-800'}`}>
                                                            {option.label}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">{option.time}</p>
                                                    </div>
                                                    {selectedService === option.value && (
                                                        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="p-3 bg-slate-50 border border-border rounded-md">
                                        <p className="text-xs text-slate-600 font-semibold mb-1">Culte sélectionné</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedService}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Hommes</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={attForm.men}
                                                onChange={e => setAttForm(p => ({ ...p, men: e.target.value }))}
                                                className="w-full text-center text-xl font-bold text-slate-800 p-2.5 border border-border rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Femmes</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={attForm.women}
                                                onChange={e => setAttForm(p => ({ ...p, women: e.target.value }))}
                                                className="w-full text-center text-xl font-bold text-slate-800 p-2.5 border border-border rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Enfants</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={attForm.children}
                                                onChange={e => setAttForm(p => ({ ...p, children: e.target.value }))}
                                                className="w-full text-center text-xl font-bold text-slate-800 p-2.5 border border-border rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Visiteurs</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={attForm.visitors}
                                                onChange={e => setAttForm(p => ({ ...p, visitors: e.target.value }))}
                                                className="w-full text-center text-xl font-bold text-slate-800 p-2.5 border border-border rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Live Total */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-border rounded-md mt-4">
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Total Présents</span>
                                        <span className="text-3xl font-bold text-primary">
                                            <AnimatedCounter value={totalAttendance} />
                                        </span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Offerings */}
                            {step === 'offering' && (
                                <motion.div
                                    key="offering"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-4"
                                >
                                    {offerings.map((o, idx) => (
                                        <div key={o.id} className="p-4 bg-white border border-border shadow-sm rounded-md space-y-3 relative">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                                                    Entrée {idx + 1}
                                                </span>
                                                {offerings.length > 1 && (
                                                    <button
                                                        onClick={() => removeOfferingLine(o.id)}
                                                        className="text-[10px] font-bold text-[#D81124] hover:underline uppercase tracking-wider"
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Catégorie</label>
                                                    <select
                                                        value={o.type}
                                                        onChange={e => updateOffering(o.id, 'type', e.target.value)}
                                                        className="w-full p-2 border border-border rounded text-sm text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                    >
                                                        <option value="Offrande">Offrande</option>
                                                        <option value="Dîme">Dîme</option>
                                                        <option value="Action de grâce">Action de Grâce</option>
                                                        <option value="Offrande du prophète">Off. Prophète</option>
                                                        <option value="Dons">Dons</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Compte Cible</label>
                                                    <select
                                                        value={o.account}
                                                        onChange={e => updateOffering(o.id, 'account', e.target.value)}
                                                        className="w-full p-2 border border-border rounded text-sm text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                    >
                                                        <option value="Cash">Cash</option>
                                                        <option value="Rawbank">Rawbank</option>
                                                        <option value="Equity">Equity</option>
                                                        <option value="Mpesa">M-Pesa</option>
                                                        <option value="OrangeMoney">Orange Money</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Montant & Devise</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={o.amount}
                                                        onChange={e => updateOffering(o.id, 'amount', e.target.value)}
                                                        className="flex-1 text-sm font-bold text-slate-900 p-2 border border-border rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                        placeholder="Saisir montant"
                                                    />
                                                    <div className="flex rounded overflow-hidden border border-border bg-slate-50 p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateOffering(o.id, 'currency', 'CDF')}
                                                            className={`px-3 py-1.5 text-[10px] font-bold tracking-widest rounded-sm transition-colors ${o.currency === 'CDF' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}
                                                        >
                                                            CDF
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateOffering(o.id, 'currency', 'USD')}
                                                            className={`px-3 py-1.5 text-[10px] font-bold tracking-widest rounded-sm transition-colors ${o.currency === 'USD' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}
                                                        >
                                                            USD
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addOfferingLine}
                                        className="w-full p-2.5 border border-dashed border-slate-300 rounded-md text-xs font-bold text-slate-500 uppercase tracking-wider hover:border-primary hover:text-primary transition-colors bg-slate-50/50 hover:bg-blue-50/30"
                                    >
                                        + Ajouter une ligne de réception
                                    </button>
                                </motion.div>
                            )}

                            {/* Step 4: Summary */}
                            {step === 'summary' && (
                                <motion.div
                                    key="summary"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="p-4 bg-white border border-border rounded-md shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informations du Culte</h3>
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 font-bold uppercase rounded">Étape finale</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{selectedService}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white border border-border rounded-md shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Répartition Présences</p>
                                            <div className="space-y-1.5 text-xs text-slate-700">
                                                <div className="flex justify-between"><span>Hommes:</span> <span className="font-bold">{attForm.men || 0}</span></div>
                                                <div className="flex justify-between"><span>Femmes:</span> <span className="font-bold">{attForm.women || 0}</span></div>
                                                <div className="flex justify-between"><span>Enfants:</span> <span className="font-bold">{attForm.children || 0}</span></div>
                                                <div className="flex justify-between"><span>Visiteurs:</span> <span className="font-bold text-primary">{attForm.visitors || 0}</span></div>
                                                <div className="pt-2 border-t border-slate-100 mt-2 flex justify-between">
                                                    <span className="font-bold uppercase tracking-wide text-slate-800">Total:</span>
                                                    <span className="font-bold text-slate-800">{totalAttendance}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-white border border-border rounded-md shadow-sm flex flex-col">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Totaux Financiers</p>
                                            <div className="flex-1 flex flex-col justify-center space-y-3">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Total CDF</p>
                                                    <p className="text-lg font-bold text-slate-800 leading-none">FC {totalOfferingsCDF.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Total USD</p>
                                                    <p className="text-lg font-bold text-slate-800 leading-none">${totalOfferingsUSD.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-border bg-slate-50 flex items-center justify-between">
                        {step !== 'service' ? (
                            <button
                                onClick={() => {
                                    const prevSteps: Record<Step, Step> = { service: 'service', attendance: 'service', offering: 'attendance', summary: 'offering' };
                                    setStep(prevSteps[step]);
                                }}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors uppercase tracking-wide"
                            >
                                Retour
                            </button>
                        ) : (
                            <div />
                        )}

                        {step === 'service' && (
                            <button
                                onClick={() => setStep('attendance')}
                                disabled={!canProceedFromService}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Suivant
                            </button>
                        )}

                        {step === 'attendance' && (
                            <button
                                onClick={() => setStep('offering')}
                                disabled={!canProceedFromAttendance}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Suivant
                            </button>
                        )}

                        {step === 'offering' && (
                            <button
                                onClick={() => setStep('summary')}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors"
                            >
                                Valider
                            </button>
                        )}

                        {step === 'summary' && (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold uppercase tracking-widest rounded shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? 'Traitement...' : 'Clôturer le Culte'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SundayQuickEntry;
