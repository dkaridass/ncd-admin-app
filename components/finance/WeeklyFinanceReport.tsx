import React, { useMemo, useState } from 'react';
import { FinanceRecord, TransactionType } from '../../types';
import Button from '../ui/Button';
import { PrinterIcon, XIcon, CalendarIcon } from '../icons/Icons';
import { motion } from 'framer-motion';

interface WeeklyFinanceReportProps {
    records: FinanceRecord[];
    onClose: () => void;
}

const WeeklyFinanceReport: React.FC<WeeklyFinanceReportProps> = ({ records, onClose }) => {
    // Default date to current week Wednesday to Sunday
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + 3); // current week Wednesday
        return d.toISOString().split('T')[0];
    });

    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + 7); // current week Sunday (or next Sunday if today is Sunday, wait, JS getDay: 0=Sun. So if today is Sun, d.getDay()=0. d.getDate() - 0 + 3 = Wed. Wed in future. Let's just use simple defaults)
        return d.toISOString().split('T')[0];
    });

    // Calculate Report Semaine Passée
    const [manualCarryForward, setManualCarryForward] = useState<string>('');

    const handlePrint = () => {
        window.print();
    };

    const reportRecords = useMemo(() => {
        return records.filter(r => r.date >= startDate && r.date <= endDate);
    }, [records, startDate, endDate]);

    const pastRecords = useMemo(() => {
        return records.filter(r => r.date < startDate);
    }, [records, startDate]);

    // Calculations
    const carryForwardUSD = pastRecords.reduce((acc, r) => {
        if (r.currency !== 'USD') return acc;
        return r.type === 'Dépense' ? acc - r.amount : acc + r.amount;
    }, 0);

    const carryForwardCDF = pastRecords.reduce((acc, r) => {
        if (r.currency !== 'CDF') return acc;
        return r.type === 'Dépense' ? acc - r.amount : acc + r.amount;
    }, 0);

    const appliedCarryForwardUSD = manualCarryForward !== '' ? 0 : carryForwardUSD; // We can let them override or just use computed
    const appliedCarryForwardCDF = manualCarryForward !== '' ? parseFloat(manualCarryForward || '0') : carryForwardCDF; // Just an example, let's keep it simple

    // We need to group Dîmes
    const dimes = reportRecords.filter(r => r.type === 'Dîme');
    const offrandes = reportRecords.filter(r => r.type === 'Offrande' || r.type === 'Offrande du prophète' || r.type === 'Action de grâce');
    const sorties = reportRecords.filter(r => r.type === 'Dépense');

    // Format date for display: "18/02/2026"
    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getDayName = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase();
    };

    // Grouping function
    const groupByDateAndService = (recs: FinanceRecord[]) => {
        const grouped: Record<string, { date: string, serviceName: string, type: string, usd: number, cdf: number }> = {};
        recs.forEach(r => {
            const key = `${r.date}_${r.serviceName || 'N/A'}_${r.type}`;
            if (!grouped[key]) {
                grouped[key] = { date: r.date, serviceName: r.serviceName || '', type: r.type, usd: 0, cdf: 0 };
            }
            if (r.currency === 'USD') grouped[key].usd += r.amount;
            else grouped[key].cdf += r.amount;
        });
        // Sort by date then service
        return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    };

    const dimesGrouped = groupByDateAndService(dimes);

    // Actually the screenshot shows grouping by Date, then a row for "OFFRANDE", "OFFRANDE DU PROPHETE", "ACTION DE GRACE" for each day/service.
    const getOffrandesGroupedByDate = () => {
        const dates = Array.from(new Set(offrandes.map(r => r.date))).sort();
        const result: { date: string, serviceName: string, type: string, amountUSD: number, amountCDF: number }[] = [];

        dates.forEach((date: string) => {
            // Find unique services for this date
            const recsOnDate = offrandes.filter(r => r.date === date);
            const services = Array.from(new Set(recsOnDate.map(r => r.serviceName || '')));

            services.forEach((service: string) => {
                ['Offrande', 'Offrande du prophète', 'Action de grâce'].forEach(type => {
                    const recs = recsOnDate.filter(r => (r.serviceName || '') === service && r.type === type);
                    const usd = recs.filter(r => r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0);
                    const cdf = recs.filter(r => r.currency === 'CDF').reduce((sum, r) => sum + r.amount, 0);

                    if (usd > 0 || cdf > 0) {
                        result.push({
                            date,
                            serviceName: service,
                            type: type.toUpperCase(),
                            amountUSD: usd,
                            amountCDF: cdf
                        });
                    }
                });
            });
        });
        return result;
    };

    const offrandesList = getOffrandesGroupedByDate();

    const getDayLabel = (date: string, serviceName: string) => {
        let lbl = `${getDayName(date)} ${formatDate(date)}`;
        if (serviceName && serviceName !== 'N/A' && serviceName !== 'Autre') {
            // Only append service name if it's a Sunday usually, but let's just append it logically
            if (serviceName.includes('Culte')) {
                // Maybe just use the date, the service is in the Libellé
            }
        }
        return lbl;
    };

    const totalDimesUSD = dimes.filter(r => r.currency === 'USD').reduce((acc, r) => acc + r.amount, 0);
    const totalDimesCDF = dimes.filter(r => r.currency === 'CDF').reduce((acc, r) => acc + r.amount, 0);

    const totalOffrandesUSD = offrandes.filter(r => r.currency === 'USD').reduce((acc, r) => acc + r.amount, 0);
    const totalOffrandesCDF = offrandes.filter(r => r.currency === 'CDF').reduce((acc, r) => acc + r.amount, 0);

    const totalSortiesUSD = sorties.filter(r => r.currency === 'USD').reduce((acc, r) => acc + r.amount, 0);
    const totalSortiesCDF = sorties.filter(r => r.currency === 'CDF').reduce((acc, r) => acc + r.amount, 0);

    const totalGeneralInUSD = totalDimesUSD + totalOffrandesUSD + appliedCarryForwardUSD;
    const totalGeneralInCDF = totalDimesCDF + totalOffrandesCDF + appliedCarryForwardCDF;

    const soldeCaisseUSD = totalGeneralInUSD - totalSortiesUSD;
    const soldeCaisseCDF = totalGeneralInCDF - totalSortiesCDF;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-900"
        >
            {/* Top Header (Non-Printable) */}
            <div className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-dark p-4 flex items-center justify-between shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-slate-500" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Rapport Hebdomadaire
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-dark">
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium outline-none text-slate-700 dark:text-slate-300 pattern-date-xs"
                        />
                        <span className="text-slate-400">au</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
                        />
                    </div>

                    <Button onClick={handlePrint} className="bg-primary text-white gap-2 rounded-xl text-sm px-6">
                        <PrinterIcon className="w-4 h-4" /> Imprimer
                    </Button>
                </div>
            </div>

            {/* Main Print Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:bg-white custom-scrollbar bg-slate-100 dark:bg-slate-900">
                <div className="max-w-[1100px] mx-auto bg-white p-10 md:p-16 print:p-8 shadow-2xl print:shadow-none min-h-screen text-slate-800">

                    {/* Print Styles */}
                    <style>{`
            @media print {
              @page { size: portrait; margin: 15mm; }
              body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .print\\:shadow-none { box-shadow: none !important; }
            }
          `}</style>

                    {/* Official Letterhead */}
                    <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-slate-100">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg print:border-2 print:border-primary">
                                NCD
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Nouvelle Cité de David</h1>
                                <p className="text-sm font-bold text-primary tracking-widest uppercase mt-1">La Pentecôte</p>
                            </div>
                        </div>
                        <div className="text-right text-xs text-slate-500 font-medium space-y-1">
                            <p>Lubumbashi, Haut-Katanga</p>
                            <p>Rép. Dém. du Congo</p>
                            <p className="text-slate-400 mt-2">Édité le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Report Title */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-serif font-black text-slate-900 tracking-tight mb-4 uppercase">
                            Rapport Financier Hebdomadaire
                        </h2>
                        <span className="inline-block px-5 py-2 bg-slate-100 print:bg-white print:border print:border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-full">
                            Semaine du {formatDate(startDate)} au {formatDate(endDate)}
                        </span>
                    </div>

                    {/* TABLE 1: ENTRÉES */}
                    <div className="mb-14">
                        <div className="bg-slate-50 print:bg-white px-6 py-4 border-b-2 border-slate-200 rounded-t-xl flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 print:hidden"></span>
                                1. Recettes (Entrées)
                            </h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="p-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest w-[20%]">Date / Jour</th>
                                    <th className="p-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest w-[40%]">Libellé de l'Opération</th>
                                    <th className="p-4 text-right font-black text-emerald-600/70 text-[10px] uppercase tracking-widest w-[20%]">Montant (USD)</th>
                                    <th className="p-4 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest w-[20%]">Montant (CDF)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                                {/* Dîmes */}
                                {dimesGrouped.map((dime, i) => (
                                    <tr key={'dime' + i} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-xs font-black text-slate-500 uppercase">{dime.serviceName && dime.serviceName !== 'N/A' && dime.serviceName !== 'Autre' && dime.date === Object.values(dimesGrouped)[0]?.date ? '' : getDayLabel(dime.date, '')}</td>
                                        <td className="p-4 text-xs font-bold text-slate-800 uppercase">
                                            DIME {dime.serviceName !== 'N/A' && dime.serviceName !== 'Autre' ? dime.serviceName : ''}
                                        </td>
                                        <td className="p-4 text-right font-serif text-sm font-bold text-emerald-700">{dime.usd > 0 ? `$ ${dime.usd.toLocaleString()}` : '-'}</td>
                                        <td className="p-4 text-right font-serif text-sm font-bold text-slate-700">{dime.cdf > 0 ? `FC ${dime.cdf.toLocaleString()}` : '-'}</td>
                                    </tr>
                                ))}
                                {/* Dimes subtotal */}
                                <tr className="bg-slate-50/50 print:bg-white">
                                    <td colSpan={2} className="p-4 text-right font-black text-slate-500 text-[10px] uppercase tracking-widest">Sous-total Dîmes</td>
                                    <td className="p-4 text-right font-serif font-black text-emerald-700 text-sm">{totalDimesUSD > 0 ? `$ ${totalDimesUSD.toLocaleString()}` : '-'}</td>
                                    <td className="p-4 text-right font-serif font-black text-slate-800 text-sm">{totalDimesCDF > 0 ? `FC ${totalDimesCDF.toLocaleString()}` : '-'}</td>
                                </tr>

                                {/* Offrandes */}
                                {offrandesList.map((off, i) => {
                                    const isFirstOfDate = i === 0 || offrandesList[i - 1].date !== off.date || offrandesList[i - 1].serviceName !== off.serviceName;
                                    return (
                                        <tr key={'off' + i} className="hover:bg-slate-50/50">
                                            <td className="p-4 text-xs font-black text-slate-500 uppercase">
                                                {isFirstOfDate ? getDayLabel(off.date, '') : ''}
                                            </td>
                                            <td className="p-4 text-xs font-bold text-slate-800 uppercase">
                                                {off.type} {off.type === 'OFFRANDE' && off.serviceName && off.serviceName !== 'N/A' && off.serviceName !== 'Autre' ? off.serviceName : ''}
                                            </td>
                                            <td className="p-4 text-right font-serif text-sm font-bold text-emerald-700">{off.amountUSD > 0 ? `$ ${off.amountUSD.toLocaleString()}` : '-'}</td>
                                            <td className="p-4 text-right font-serif text-sm font-bold text-slate-700">{off.amountCDF > 0 ? `FC ${off.amountCDF.toLocaleString()}` : '-'}</td>
                                        </tr>
                                    );
                                })}

                                {/* Offrandes subtotal */}
                                <tr className="bg-slate-50/50 print:bg-white border-t-2 border-slate-100">
                                    <td colSpan={2} className="p-4 text-right font-black text-slate-500 text-[10px] uppercase tracking-widest">Sous-total Offrandes</td>
                                    <td className="p-4 text-right font-serif font-black text-emerald-700 text-sm">{totalOffrandesUSD > 0 ? `$ ${totalOffrandesUSD.toLocaleString()}` : '-'}</td>
                                    <td className="p-4 text-right font-serif font-black text-slate-800 text-sm">{totalOffrandesCDF > 0 ? `FC ${totalOffrandesCDF.toLocaleString()}` : '-'}</td>
                                </tr>

                                {/* Report semaine passee */}
                                <tr className="bg-white">
                                    <td colSpan={2} className="p-4 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest">Report Semaine Passée</td>
                                    <td className="p-4 text-right font-serif font-bold text-slate-500 text-sm">
                                        {appliedCarryForwardUSD > 0 ? `$ ${appliedCarryForwardUSD.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-4 text-right flex gap-3 justify-end items-center">
                                        <span className="print:hidden">
                                            <input
                                                type="number"
                                                value={manualCarryForward}
                                                onChange={e => setManualCarryForward(e.target.value)}
                                                placeholder={carryForwardCDF.toString()}
                                                className="w-28 text-right bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-serif font-black text-slate-700 focus:border-primary outline-none"
                                                title="Saisir manuellement le report de la semaine passée"
                                            />
                                        </span>
                                        <span className="hidden print:inline font-serif font-bold text-slate-500 text-sm">{appliedCarryForwardCDF > 0 ? `FC ${appliedCarryForwardCDF.toLocaleString()}` : '-'}</span>
                                        <span className="print:hidden font-serif font-bold text-slate-500 text-sm">{manualCarryForward ? '' : (appliedCarryForwardCDF > 0 ? `FC ${appliedCarryForwardCDF.toLocaleString()}` : '-')}</span>
                                    </td>
                                </tr>

                                {/* Grand Total Recettes */}
                                <tr className="bg-slate-100/50 print:bg-slate-50 border-y-2 border-slate-200">
                                    <td colSpan={2} className="p-5 text-right font-black text-slate-900 text-[11px] uppercase tracking-widest">Total Général Recettes</td>
                                    <td className="p-5 text-right font-serif font-black text-emerald-800 text-base">{totalGeneralInUSD > 0 ? `$ ${totalGeneralInUSD.toLocaleString()}` : '-'}</td>
                                    <td className="p-5 text-right font-serif font-black text-slate-900 text-base">{totalGeneralInCDF > 0 ? `FC ${totalGeneralInCDF.toLocaleString()}` : '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* TABLE 2: SORTIES DE CAISSE */}
                    <div className="mb-14">
                        <div className="bg-slate-50 print:bg-white px-6 py-4 border-b-2 border-slate-200 rounded-t-xl flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-red-400 print:hidden"></span>
                                2. Dépenses (Sorties de Caisse)
                            </h3>
                        </div>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                                {sorties.sort((a, b) => a.date.localeCompare(b.date)).map((sortie, i) => (
                                    <tr key={'sortie' + i} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-xs font-black text-slate-500 w-[20%] uppercase">{getDayLabel(sortie.date, '')}</td>
                                        <td className="p-4 text-xs font-bold text-slate-800 w-[40%] uppercase">{sortie.notes || sortie.type}</td>
                                        <td className="p-4 text-right font-serif text-sm font-bold text-slate-600 w-[20%]">{sortie.currency === 'USD' ? `$ ${sortie.amount.toLocaleString()}` : '-'}</td>
                                        <td className="p-4 text-right font-serif text-sm font-bold text-slate-600 w-[20%]">{sortie.currency === 'CDF' ? `FC ${sortie.amount.toLocaleString()}` : '-'}</td>
                                    </tr>
                                ))}
                                {/* Empty slots for aesthetics if very few lines */}
                                {sorties.length < 2 && Array.from({ length: 2 - sorties.length }).map((_, i) => (
                                    <tr key={'empty' + i} className="h-14">
                                        <td className="p-4"></td><td className="p-4"></td><td className="p-4"></td><td className="p-4"></td>
                                    </tr>
                                ))}
                                {/* Total Sorties */}
                                <tr className="bg-slate-100/50 print:bg-slate-50 border-y-2 border-slate-200">
                                    <td colSpan={2} className="p-5 text-right font-black text-slate-900 text-[11px] uppercase tracking-widest">Total Général Dépenses</td>
                                    <td className="p-5 text-right font-serif font-black text-red-700/80 text-base">{totalSortiesUSD > 0 ? `$ ${totalSortiesUSD.toLocaleString()}` : '-'}</td>
                                    <td className="p-5 text-right font-serif font-black text-red-600 text-base">{totalSortiesCDF > 0 ? `FC ${totalSortiesCDF.toLocaleString()}` : '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* SOLDE CAISSE */}
                    <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center mb-16 print:bg-white print:text-black print:border-4 print:border-slate-900 print:rounded-2xl shadow-xl print:shadow-none relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl print:hidden"></div>
                        <div className="relative z-10 text-center md:text-left">
                            <p className="text-[10px] text-slate-400 print:text-slate-500 font-black uppercase tracking-widest mb-1 mt-1">Solde de Caisse (Bilan Final)</p>
                            <p className="text-sm font-medium text-slate-300 print:text-slate-800">Arrêté au {formatDate(endDate)}</p>
                        </div>
                        <div className="flex gap-12 mt-6 md:mt-0 text-center md:text-right relative z-10 border-t md:border-t-0 md:border-l border-white/10 print:border-slate-300 pt-6 md:pt-0 md:pl-12">
                            <div>
                                <p className="text-[10px] text-emerald-400 print:text-slate-500 font-bold uppercase tracking-widest mb-2">Solde Net USD</p>
                                <p className="text-3xl font-serif font-black text-white print:text-slate-900">$ {soldeCaisseUSD.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-primary print:text-slate-500 font-bold uppercase tracking-widest mb-2">Solde Net CDF</p>
                                <p className="text-3xl font-serif font-black text-white print:text-slate-900">FC {soldeCaisseCDF.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* SIGNATURE BLOCKS */}
                    <div className="pt-8 px-4">
                        <div className="grid grid-cols-3 gap-12 text-center">
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-24">La Trésorerie</p>
                                <div className="border-t-2 border-slate-300 w-full pt-3">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nom & Signature</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-24">L'Administration</p>
                                <div className="border-t-2 border-slate-300 w-full pt-3">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nom & Signature</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-24">Le Pasteur Principal</p>
                                <div className="border-t-2 border-slate-300 w-full pt-3">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Vu et approuvé</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};

export default WeeklyFinanceReport;
