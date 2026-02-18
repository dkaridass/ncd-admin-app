
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PageTransition from '../components/layout/PageTransition';
import PermissionGuard from '../components/auth/PermissionGuard';
import { SparklesIcon, PlusCircleIcon, ShieldIcon, DollarSignIcon } from '../components/icons/Icons';
import { TransactionType, Currency, FinanceRecord, FinanceAccount } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import LedgerTable from '../components/finances/LedgerTable';
import DateRangeSelector, { DateRangePreset } from '../components/finance/DateRangeSelector';
import FinanceReportsSummary from '../components/finance/FinanceReportsSummary';
import RevenueChart from '../components/finance/RevenueChart';
import CategoryBreakdown from '../components/finance/CategoryBreakdown';
import CategoryTable from '../components/finance/CategoryTable';
import ExportMenu from '../components/finance/ExportMenu';
import ExchangeRateCard from '../components/finance/ExchangeRateCard';
import AccountBalancesStrip from '../components/finance/AccountBalancesStrip';
import ServiceSummary from '../components/finance/ServiceSummary';
import { showSuccess, showError } from '../utils/toast';

const FinancesPage: React.FC = () => {
  const dataContext = useData();
  const financeRecords = dataContext.financeRecords || [];
  const { addFinanceRecord, hasPermission, currentUser } = dataContext;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('Dîme');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'ENTREES' | 'SORTIES' | 'TOUS'>('TOUS');
  const [activeCurrencyTab, setActiveCurrencyTab] = useState<'GLOBAL' | 'USD' | 'CDF'>('GLOBAL');
  const [inputMode, setInputMode] = useState<'SINGLE' | 'BATCH' | 'REPORT'>('SINGLE');

  // Service Report State
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportService, setReportService] = useState<string>('1er Culte');
  const [reportData, setReportData] = useState<Record<string, { CDF: string, USD: string, notes: string }>>({
    'Offrande': { CDF: '', USD: '', notes: '' },
    'Dîme': { CDF: '', USD: '', notes: '' },
    'Offrande du prophète': { CDF: '', USD: '', notes: '' },
    'Action de grâce': { CDF: '', USD: '', notes: '' },
    'Dons': { CDF: '', USD: '', notes: '' },
    'Autre': { CDF: '', USD: '', notes: '' },
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Date Range State for Reports
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('month');
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Batch Mode State
  const [batchSettings, setBatchSettings] = useState({
    date: new Date().toISOString().split('T')[0],
    serviceName: '1er Culte' as string,
    defaultType: 'Offrande' as TransactionType,
    defaultCurrency: 'CDF' as Currency,
    defaultAccount: 'Cash' as FinanceAccount
  });

  const [batchRows, setBatchRows] = useState<Array<{
    id: string;
    amount: string;
    memberName: string;
    notes: string;
  }>>([
    { id: '1', amount: '', memberName: '', notes: '' }
  ]);

  const cultesDisponibles = [
    '1er Culte', '2ème Culte', '3ème Culte',
    'Culte Mercredi', 'Culte Vendredi', 'Séminaire', 'Autre'
  ];

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'CDF' as Currency,
    date: new Date().toISOString().split('T')[0],
    account: 'Cash' as FinanceAccount,
    memberName: '',
    notes: '',
    serviceName: '1er Culte'
  });

  const openModal = (type: TransactionType) => {
    setModalType(type);
    setIsModalOpen(true);
    setFormData(prev => ({ ...prev, amount: '', currency: type === 'Dépense' ? 'USD' : 'CDF', memberName: '', notes: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        showError("Montant invalide");
        setIsSubmitting(false);
        return;
      }

      // Validation: Offrande requires Service Name
      if (modalType === 'Offrande' && !formData.serviceName) {
        showError("Veuillez sélectionner une session de culte pour l'offrande.");
        setIsSubmitting(false);
        return;
      }

      const newRecord: Omit<FinanceRecord, 'id'> = {
        type: modalType,
        amount: amount,
        currency: formData.currency,
        account: formData.account,
        date: formData.date,
        memberName: modalType !== 'Dépense' ? formData.memberName : undefined,
        notes: modalType === 'Dépense' ? formData.notes : undefined,
        serviceName: (modalType === 'Offrande' || modalType === 'Action de grâce' || modalType === 'Offrande du prophète') ? formData.serviceName : undefined,
        recordedBy: currentUser?.name || 'Admin',
        isApproved: modalType !== 'Dépense'
      };

      await addFinanceRecord(newRecord);
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, amount: '', memberName: '', notes: '' }));
      showSuccess(`✅ ${modalType} enregistré avec succès`);
    } catch (error: any) {
      console.error("Erreur enregistrement:", error);
      showError(`Erreur lors de l'enregistrement: ${error.message || "Une erreur inconnue est survenue"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch Functions
  const handleBatchRowChange = (id: string, field: string, value: any) => {
    setBatchRows(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addBatchRow = () => {
    setBatchRows(prev => [
      ...prev,
      { id: Date.now().toString(), amount: '', memberName: '', notes: '' }
    ]);
  };

  const removeBatchRow = (id: string) => {
    if (batchRows.length > 1) {
      setBatchRows(prev => prev.filter(r => r.id !== id));
    }
  };

  const submitBatch = async () => {
    setIsSubmittingBatch(true);
    let count = 0;
    let errors = 0;

    try {
      for (const row of batchRows) {
        const amount = parseFloat(row.amount);
        if (!isNaN(amount) && amount > 0) {
          try {
            const newRecord: Omit<FinanceRecord, 'id'> = {
              type: batchSettings.defaultType,
              amount: amount,
              currency: batchSettings.defaultCurrency,
              account: batchSettings.defaultAccount,
              date: batchSettings.date,
              serviceName: batchSettings.serviceName,
              memberName: row.memberName || undefined,
              notes: row.notes || undefined,
              recordedBy: currentUser?.name || 'Admin',
              isApproved: true
            };
            await addFinanceRecord(newRecord);
            count++;
          } catch (error) {
            errors++;
            console.error('Error adding batch record:', error);
          }
        }
      }

      if (count > 0) {
        showSuccess(`✅ ${count} opération${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''} avec succès`);
      }
      if (errors > 0) {
        showError(`⚠️ ${errors} opération${errors > 1 ? 's' : ''} n'a${errors > 1 ? 'ont' : ''} pas pu être enregistrée${errors > 1 ? 's' : ''}`);
      }

      // Reset after success
      setInputMode('SINGLE');
      setBatchRows([{ id: Date.now().toString(), amount: '', memberName: '', notes: '' }]);
    } catch (error: any) {
      showError(`Erreur lors de l'enregistrement du lot: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Service Report Logic
  const handleReportChange = (category: string, field: 'CDF' | 'USD' | 'notes', value: string) => {
    setReportData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const submitServiceReport = async () => {
    setIsSubmittingReport(true);
    let count = 0;
    try {
      // Use keys to ensure type safety
      const categories = Object.keys(reportData) as Array<keyof typeof reportData>;
      for (const category of categories) {
        const data = reportData[category];

        // Process CDF
        const amountCDF = parseFloat(data.CDF);
        if (!isNaN(amountCDF) && amountCDF > 0) {
          await addFinanceRecord({
            type: category as TransactionType,
            amount: amountCDF,
            currency: 'CDF',
            account: 'Cash', // Default to Cash for service report
            date: reportDate,
            serviceName: reportService,
            notes: data.notes || undefined,
            recordedBy: currentUser?.name || 'Admin',
            isApproved: true
          });
          count++;
        }

        // Process USD
        const amountUSD = parseFloat(data.USD);
        if (!isNaN(amountUSD) && amountUSD > 0) {
          await addFinanceRecord({
            type: category as TransactionType,
            amount: amountUSD,
            currency: 'USD',
            account: 'Cash',
            date: reportDate,
            serviceName: reportService,
            notes: data.notes || undefined,
            recordedBy: currentUser?.name || 'Admin',
            isApproved: true
          });
          count++;
        }
      }

      if (count > 0) {
        showSuccess(`✅ Rapport Validé : ${count} écritures enregistrées pour ${reportService}`);
        // Reset amounts only
        setReportData({
          'Offrande': { CDF: '', USD: '', notes: '' },
          'Dîme': { CDF: '', USD: '', notes: '' },
          'Offrande du prophète': { CDF: '', USD: '', notes: '' },
          'Action de grâce': { CDF: '', USD: '', notes: '' },
          'Dons': { CDF: '', USD: '', notes: '' },
          'Autre': { CDF: '', USD: '', notes: '' },
        });
      } else {
        showError("⚠️ Aucune donnée à enregistrer (montants vides ou 0)");
      }
    } catch (error: any) {
      console.error("Erreur rapport:", error);
      showError("Erreur lors de l'enregistrement du rapport");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const batchTotal = batchRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  // Date Range Calculation
  const getDateRange = (): { start: string; end: string; label: string } => {
    const now = new Date();
    let start: Date, end: Date, label: string;

    switch (dateRangePreset) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        label = `${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        label = `Q${quarter + 1} ${now.getFullYear()}`;
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        label = `${now.getFullYear()}`;
        break;
      case 'custom':
        start = new Date(customStartDate);
        end = new Date(customEndDate);
        label = 'Période personnalisée';
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      label,
    };
  };

  const dateRange = getDateRange();

  // Filter records by date range
  const periodRecords = (financeRecords && Array.isArray(financeRecords) ? financeRecords : []).filter(r =>
    r.date >= dateRange.start && r.date <= dateRange.end
  );

  // Calculate period summary
  const periodSummary = {
    income: {
      usd: periodRecords.filter(r => r.currency === 'USD' && r.type !== 'Dépense').reduce((sum, r) => sum + r.amount, 0),
      cdf: periodRecords.filter(r => r.currency === 'CDF' && r.type !== 'Dépense').reduce((sum, r) => sum + r.amount, 0),
    },
    expenses: {
      usd: periodRecords.filter(r => r.currency === 'USD' && r.type === 'Dépense').reduce((sum, r) => sum + r.amount, 0),
      cdf: periodRecords.filter(r => r.currency === 'CDF' && r.type === 'Dépense').reduce((sum, r) => sum + r.amount, 0),
    },
    balance: {
      usd: 0,
      cdf: 0,
    }
  };

  periodSummary.balance.usd = periodSummary.income.usd - periodSummary.expenses.usd;
  periodSummary.balance.cdf = periodSummary.income.cdf - periodSummary.expenses.cdf;

  const filteredRecords = (financeRecords && Array.isArray(financeRecords) ? financeRecords : []).filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (r.memberName?.toLowerCase().includes(term) ||
      r.notes?.toLowerCase().includes(term) ||
      r.serviceName?.toLowerCase().includes(term));

    // Currency Tab Filter
    const matchesCurrency = activeCurrencyTab === 'GLOBAL' ? true : r.currency === activeCurrencyTab;

    const matchesView = activeView === 'TOUS' || (activeView === 'ENTREES' && r.type !== 'Dépense') || (activeView === 'SORTIES' && r.type === 'Dépense');
    return matchesSearch && matchesView && matchesCurrency;
  });

  const totals = {
    CDF_IN: (financeRecords && Array.isArray(financeRecords) ? financeRecords : []).filter(r => r.currency === 'CDF' && r.type !== 'Dépense').reduce((acc, r) => acc + r.amount, 0),
    CDF_OUT: (financeRecords && Array.isArray(financeRecords) ? financeRecords : []).filter(r => r.currency === 'CDF' && r.type === 'Dépense').reduce((acc, r) => acc + r.amount, 0),
    USD_IN: (financeRecords && Array.isArray(financeRecords) ? financeRecords : []).filter(r => r.currency === 'USD' && r.type !== 'Dépense').reduce((acc, r) => acc + r.amount, 0),
    USD_OUT: (financeRecords && Array.isArray(financeRecords) ? financeRecords : []).filter(r => r.currency === 'USD' && r.type === 'Dépense').reduce((acc, r) => acc + r.amount, 0),
  };

  // Calculate Account Balances
  const accountBalances: Record<FinanceAccount, { cdf: number, usd: number }> = {
    'Rawbank': { cdf: 0, usd: 0 },
    'Equity': { cdf: 0, usd: 0 },
    'PayPal': { cdf: 0, usd: 0 },
    'Mpesa': { cdf: 0, usd: 0 },
    'OrangeMoney': { cdf: 0, usd: 0 },
    'MoneyGram': { cdf: 0, usd: 0 },
    'Cash': { cdf: 0, usd: 0 }
  };

  if (financeRecords && Array.isArray(financeRecords)) {
    financeRecords.forEach(r => {
      const acc = r.account || 'Cash'; // Default to Cash if missing
      if (accountBalances[acc]) { // Type check safety
        if (r.type === 'Dépense') {
          if (r.currency === 'CDF') accountBalances[acc].cdf -= r.amount;
          else accountBalances[acc].usd -= r.amount;
        } else {
          if (r.currency === 'CDF') accountBalances[acc].cdf += r.amount;
          else accountBalances[acc].usd += r.amount;
        }
      }
    });
  }

  if (!hasPermission('VIEW_FINANCES')) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <ShieldIcon className="w-20 h-20 text-slate-100 mb-8" />
        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">Accès Trésorerie Restreint</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary font-display tracking-tight leading-none mb-1 uppercase italic">Grand Livre</h2>
          <p className="text-slate-500 font-medium italic opacity-80 uppercase tracking-widest text-[9px]">Gestion Royale • NCD La Pentecôte</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportMenu records={periodRecords} periodLabel={dateRange.label} summary={periodSummary} />
          <PermissionGuard permission="CREATE_FINANCES">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setInputMode('SINGLE')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'SINGLE' ? 'bg-white text-primary shadow-sm border border-primary/20' : 'bg-transparent text-slate-600 hover:text-primary hover:bg-slate-50'}`}
              >
                Vue Journal
              </button>
              <button
                onClick={() => setInputMode('BATCH')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'BATCH' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-slate-600 hover:text-primary hover:bg-slate-50'}`}
              >
                Saisie Rapide
              </button>
              <button
                onClick={() => setInputMode('REPORT')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'REPORT' ? 'bg-purple-600 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:text-purple-600 hover:bg-slate-50'}`}
              >
                Rapport Culte
              </button>
            </div>
            {inputMode === 'SINGLE' && (
              <Button onClick={() => openModal('Offrande')} className="rounded-xl px-4 py-3 bg-primary text-white text-[10px] uppercase font-black tracking-widest shadow-lg hover:scale-105 transition-transform">
                <PlusCircleIcon className="w-4 h-4 mr-2" />
                Opération
              </Button>
            )}
          </PermissionGuard>
        </div>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector
        startDate={customStartDate}
        endDate={customEndDate}
        onStartDateChange={setCustomStartDate}
        onEndDateChange={setCustomEndDate}
        activePreset={dateRangePreset}
        onPresetChange={setDateRangePreset}
      />

      {/* Exchange Rate & Finance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <ExchangeRateCard className="lg:col-span-1" />
        <div className="lg:col-span-3">
          <FinanceReportsSummary
            summary={periodSummary}
            periodLabel={dateRange.label}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueChart records={periodRecords} periodLabel={dateRange.label} />
        <CategoryBreakdown records={periodRecords} periodLabel={dateRange.label} />
      </div>

      {/* Manual Account Balances */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-primary mb-4 px-2">Soldes par Compte</h3>
        <AccountBalancesStrip />
      </div>

      {/* Category Analysis Table */}
      <div className="mb-8">
        <CategoryTable
          records={periodRecords}
          periodLabel={dateRange.label}
          onCategoryFilter={setActiveCategory}
          activeCategory={activeCategory}
        />
      </div>

      <AnimatePresence mode="wait">
        {inputMode === 'BATCH' ? (
          <motion.div
            key="batch"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden"
          >
            {/* Batch Header */}
            <div className="bg-slate-50/50 border-b border-slate-100 p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="Date du Culte" type="date" value={batchSettings.date} onChange={e => setBatchSettings({ ...batchSettings, date: e.target.value })} className="bg-white" />
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Session de Culte</label>
                <select value={batchSettings.serviceName} onChange={e => setBatchSettings({ ...batchSettings, serviceName: e.target.value })} className="block w-full px-5 py-4 border-2 border-slate-200 rounded-xl bg-white font-bold text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                  {cultesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Type d'Opération</label>
                <select value={batchSettings.defaultType} onChange={e => setBatchSettings({ ...batchSettings, defaultType: e.target.value as any })} className="block w-full px-5 py-4 border-2 border-slate-200 rounded-xl bg-white font-bold text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                  <option value="Offrande">Offrande</option>
                  <option value="Dîme">Dîme</option>
                  <option value="Action de grâce">Action de grâce</option>
                  <option value="Offrande du prophète">Offrânde du Prophète</option>
                  <option value="Dons">Dons</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Devise du Lot</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setBatchSettings({ ...batchSettings, defaultCurrency: 'CDF' })} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${batchSettings.defaultCurrency === 'CDF' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}>CDF</button>
                  <button onClick={() => setBatchSettings({ ...batchSettings, defaultCurrency: 'USD' })} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${batchSettings.defaultCurrency === 'USD' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}>USD</button>
                </div>
              </div>
            </div>

            {/* Batch Grid */}
            <div className="p-8">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">#</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Montant ({batchSettings.defaultCurrency})</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fidèle (Opt.)</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Note</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchRows.map((row, index) => (
                      <tr key={row.id} className="group hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-xs font-bold text-slate-300">{index + 1}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={row.amount}
                            onChange={e => handleBatchRowChange(row.id, 'amount', e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent border-none text-xl md:text-2xl font-black text-emerald-600 placeholder-slate-200 outline-none focus:ring-0 py-3"
                            autoFocus={index === batchRows.length - 1}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addBatchRow();
                            }}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.memberName}
                            onChange={e => handleBatchRowChange(row.id, 'memberName', e.target.value)}
                            placeholder="Anonyme"
                            className="w-full bg-transparent border-none text-base text-slate-600 placeholder-slate-200 outline-none focus:ring-0 py-3"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.notes}
                            onChange={e => handleBatchRowChange(row.id, 'notes', e.target.value)}
                            placeholder="-"
                            className="w-full bg-transparent border-none text-sm text-slate-400 placeholder-slate-200 outline-none focus:ring-0"
                          />
                        </td>
                        <td className="px-4 py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => removeBatchRow(row.id)} className="text-slate-300 hover:text-red-500">&times;</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={addBatchRow} className="mt-4 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-700 font-bold text-xs uppercase tracking-widest hover:border-primary hover:text-primary hover:bg-primary/5 transition-all bg-white">
                + Ajouter une ligne
              </button>

              {/* Floating Footer */}
              <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-primary p-6 rounded-2xl shadow-xl text-white">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[9px] text-white/80 uppercase tracking-widest font-black">Total Batch ({batchSettings.defaultCurrency})</p>
                    <p className="text-3xl font-display font-bold text-white">{batchSettings.defaultCurrency === 'CDF' ? 'FC' : '$'} {batchTotal.toLocaleString()}</p>
                  </div>
                </div>
                <Button
                  onClick={submitBatch}
                  variant="white"
                  isLoading={isSubmittingBatch}
                  disabled={isSubmittingBatch}
                  className="text-xs font-black uppercase tracking-[0.2em] px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-lg focus:ring-4 focus:ring-white/50"
                >
                  Valider le Lot
                </Button>
              </div>
            </div>
          </motion.div>
        ) : inputMode === 'REPORT' ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1">
                  <Input label="Date du Rapport" type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="bg-white" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Session de Culte</label>
                  <select value={reportService} onChange={e => setReportService(e.target.value)} className="block w-full px-5 py-4 border-2 border-slate-200 rounded-xl bg-white font-bold text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                    {cultesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Button onClick={submitServiceReport} isLoading={isSubmittingReport} className="rounded-xl px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white shadow-lg uppercase font-black tracking-widest text-xs">
                    Valider le Rapport
                  </Button>
                </div>
              </div>

              <div className="p-8">
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Catégorie</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Montant CDF</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Montant USD</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Commentaire (Opt.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(reportData).map(([category, data]) => (
                        <tr key={category} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-700 uppercase tracking-tight">{category}</td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">FC</span>
                              <input
                                type="number"
                                value={data.CDF}
                                onChange={e => handleReportChange(category, 'CDF', e.target.value)}
                                placeholder="0"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                              <input
                                type="number"
                                value={data.USD}
                                onChange={e => handleReportChange(category, 'USD', e.target.value)}
                                placeholder="0"
                                className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-slate-100 font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={data.notes}
                              onChange={e => handleReportChange(category, 'notes', e.target.value)}
                              placeholder="Note optionnelle..."
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-medium text-sm text-slate-600 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-slate-300"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Live Preview of the Report Summary for this Day */}
            <ServiceSummary date={reportDate} records={financeRecords} />
          </motion.div>
        ) : (
          <motion.div
            key="ledger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Existing Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="bg-primary text-white p-8 rounded-[2rem] shadow-premium relative overflow-hidden text-center">
                <p className="text-[8px] font-black opacity-60 uppercase tracking-[0.3em] mb-2">Entrées Francs</p>
                <p className="text-2xl font-black font-display text-white">FC {totals.CDF_IN.toLocaleString()}</p>
              </Card>
              <Card className="bg-white border text-red-600 p-8 rounded-[2rem] shadow-sm text-center">
                <p className="text-[8px] font-black opacity-60 uppercase tracking-[0.3em] mb-2">Sorties Francs</p>
                <p className="text-2xl font-black font-display">FC {totals.CDF_OUT.toLocaleString()}</p>
              </Card>
              <Card className="bg-secondary text-primary p-8 rounded-[2rem] shadow-premium text-center">
                <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><DollarSignIcon className="w-20 h-20" /></div>
                <p className="text-[8px] font-black opacity-60 uppercase tracking-[0.3em] mb-2">Entrées Dollars</p>
                <p className="text-2xl font-black font-display">$ {totals.USD_IN.toLocaleString()}</p>
              </Card>
              <Card className="bg-white border text-red-600 p-8 rounded-[2rem] shadow-sm text-center">
                <p className="text-[8px] font-black opacity-60 uppercase tracking-[0.3em] mb-2">Sorties Dollars</p>
                <p className="text-2xl font-black font-display">$ {totals.USD_OUT.toLocaleString()}</p>
              </Card>
            </div>

            {/* NEW Ledger Table */}
            <Card className="rounded-[3rem] overflow-hidden bg-white border border-slate-100 shadow-premium" noPadding>
              <div className="flex flex-col">
                {/* Primary Tab Bar: Currencies */}
                <div className="flex bg-slate-50/80 border-b border-slate-200/50 px-8 pt-4">
                  {[
                    { id: 'GLOBAL', label: 'Vue Globale' },
                    { id: 'USD', label: 'Livre USD ($)' },
                    { id: 'CDF', label: 'Livre Francs (FC)' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCurrencyTab(tab.id as any)}
                      className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeCurrencyTab === tab.id
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-slate-600 hover:text-primary hover:bg-slate-50'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Secondary Toolbar: Filters & Search */}
                <div className="px-8 md:px-12 py-6 flex flex-col lg:flex-row gap-6 justify-between items-center bg-white">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    {['TOUS', 'ENTREES', 'SORTIES'].map(view => (
                      <button
                        key={view}
                        onClick={() => setActiveView(view as any)}
                        className={`px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeView === view ? 'bg-white text-primary shadow-sm border border-primary/20' : 'bg-transparent text-slate-600 hover:text-primary hover:bg-slate-50'}`}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 w-full lg:w-auto">
                    <input
                      type="text"
                      placeholder="Chercher une opération..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 lg:w-80 px-4 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-900 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <LedgerTable records={filteredRecords} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Saisie de Direction : ${modalType}`}>
        <form onSubmit={handleSubmit} className="space-y-8 max-h-[85vh] overflow-y-auto px-1 py-2 custom-scrollbar">
          <div className="bg-primary/5 p-8 md:p-12 rounded-[3rem] border-2 border-primary/5">
            <label className="block text-[11px] font-black text-primary mb-6 uppercase tracking-[0.4em] text-center">Montant de l'Opération</label>
            <input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              required
              autoFocus
              className="w-full bg-white border-2 border-slate-200 rounded-[2rem] py-8 px-4 text-3xl md:text-5xl font-black text-slate-900 text-center outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner placeholder:text-slate-300"
              placeholder="0.00"
            />

            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setFormData({ ...formData, currency: 'CDF' })} className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.currency === 'CDF' ? 'bg-primary text-white shadow-xl translate-y-[-2px]' : 'bg-white text-slate-700 border-2 border-slate-200 shadow-sm hover:border-primary/50 hover:text-primary'}`}>Francs (CDF)</button>
              <button type="button" onClick={() => setFormData({ ...formData, currency: 'USD' })} className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.currency === 'USD' ? 'bg-primary text-white shadow-xl translate-y-[-2px]' : 'bg-white text-slate-700 border-2 border-slate-200 shadow-sm hover:border-primary/50 hover:text-primary'}`}>Dollars (USD)</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Date Comptable" id="date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Compte Cible</label>
              <select
                value={formData.account}
                onChange={e => setFormData({ ...formData, account: e.target.value as FinanceAccount })}
                className="block w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-white font-black text-[10px] text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="Cash">Cash / Caisse</option>
                <option value="Rawbank">Rawbank</option>
                <option value="Equity">Equity BCDC</option>
                <option value="Mpesa">M-Pesa</option>
                <option value="OrangeMoney">Orange Money</option>
                <option value="PayPal">PayPal</option>
              </select>
            </div>
            {(modalType === 'Offrande' || modalType === 'Action de grâce' || modalType === 'Offrande du prophète') && (
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Session de Culte</label>
                <select id="serviceName" value={formData.serviceName} onChange={e => setFormData({ ...formData, serviceName: e.target.value })} className="block w-full px-5 py-4 border-2 border-slate-200 rounded-2xl bg-white font-black text-[10px] text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                  {cultesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            {modalType === 'Dépense' ? (
              <textarea
                className="w-full px-8 py-6 border-2 border-slate-200 rounded-[2.5rem] bg-white text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all shadow-sm"
                rows={3}
                placeholder="Justificatif détaillé de la dépense..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                required
              />
            ) : (
              <Input label="Nom de l'âme ou du Donateur" id="memberName" value={formData.memberName} onChange={e => setFormData({ ...formData, memberName: e.target.value })} placeholder="Identité..." />
            )}
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-8 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-2xl px-10 text-[11px]">Annuler</Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className={`flex-1 py-5 rounded-[2rem] uppercase font-black tracking-widest text-[11px] text-white shadow-premium ${modalType === 'Dépense' ? 'bg-red-600' : 'bg-primary'}`}
            >
              Confirmer l'Opération
            </Button>
          </div>
        </form>
      </Modal>
    </PageTransition >
  );
};

export default FinancesPage;
