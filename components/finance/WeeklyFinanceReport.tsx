import React, { useMemo, useState } from 'react';
import { FinanceRecord } from '../../types';
import Button from '../ui/Button';
import { PrinterIcon, XIcon, CalendarIcon } from '../icons/Icons';
import { motion } from 'framer-motion';

interface WeeklyFinanceReportProps {
    records: FinanceRecord[];
    onClose: () => void;
}

const WeeklyFinanceReport: React.FC<WeeklyFinanceReportProps> = ({ records, onClose }) => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - d.getDay() + 3);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - d.getDay() + 7);
        return d.toISOString().split('T')[0];
    });
    const [manualCarryForwardCDF, setManualCarryForwardCDF] = useState('');
    const [manualCarryForwardUSD, setManualCarryForwardUSD] = useState('');

    const fmtDate = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fmtDay = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase() + ' ' + fmtDate(s);
    const fmtAmt = (n: number, currency: string) => n > 0 ? (currency === 'USD' ? `$ ${n.toLocaleString('fr-FR')}` : `FC ${n.toLocaleString('fr-FR')}`) : '–';

    const rangeRecords = useMemo(() => records.filter(r => r.date >= startDate && r.date <= endDate), [records, startDate, endDate]);

    const dimes = useMemo(() => rangeRecords.filter(r => r.type === 'Dîme').sort((a, b) => a.date.localeCompare(b.date)), [rangeRecords]);
    const offrandes = useMemo(() => rangeRecords.filter(r => ['Offrande', 'Offrande du prophète', 'Action de grâce'].includes(r.type)).sort((a, b) => a.date.localeCompare(b.date)), [rangeRecords]);
    const sorties = useMemo(() => rangeRecords.filter(r => r.type === 'Dépense').sort((a, b) => a.date.localeCompare(b.date)), [rangeRecords]);

    // Dîmes: one row per date+service
    const dimesRows = useMemo(() => {
        const map: Record<string, { date: string; label: string; usd: number; cdf: number }> = {};
        dimes.forEach(r => {
            const key = `${r.date}__${r.serviceName || ''}`;
            if (!map[key]) map[key] = { date: r.date, label: 'DÎME' + (r.serviceName ? ' ' + r.serviceName : ''), usd: 0, cdf: 0 };
            if (r.currency === 'USD') map[key].usd += r.amount; else map[key].cdf += r.amount;
        });
        return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    }, [dimes]);

    // Offrandes: grouped by date+service, then sub-rows per type
    const offrandesRows = useMemo(() => {
        const rows: { date: string; showDate: boolean; label: string; usd: number; cdf: number }[] = [];
        const dateServices: Record<string, string[]> = {};
        offrandes.forEach(r => { const k = r.date; if (!dateServices[k]) dateServices[k] = []; const s = r.serviceName || ''; if (!dateServices[k].includes(s)) dateServices[k].push(s); });
        Object.keys(dateServices).sort().forEach(date => {
            dateServices[date].forEach((svc, si) => {
                ['Offrande', 'Offrande du prophète', 'Action de grâce'].forEach((type, ti) => {
                    const recs = offrandes.filter(r => r.date === date && (r.serviceName || '') === svc && r.type === type);
                    const usd = recs.filter(r => r.currency === 'USD').reduce((s, r) => s + r.amount, 0);
                    const cdf = recs.filter(r => r.currency === 'CDF').reduce((s, r) => s + r.amount, 0);
                    if (usd > 0 || cdf > 0) {
                        const label = type.toUpperCase() + (type === 'Offrande' && svc ? ' ' + svc : '');
                        rows.push({ date, showDate: si === 0 && ti === 0, label, usd, cdf });
                    }
                });
            });
        });
        return rows;
    }, [offrandes]);

    const totalDimesUSD = dimesRows.reduce((s, r) => s + r.usd, 0);
    const totalDimesCDF = dimesRows.reduce((s, r) => s + r.cdf, 0);
    const totalOffUSD = offrandesRows.reduce((s, r) => s + r.usd, 0);
    const totalOffCDF = offrandesRows.reduce((s, r) => s + r.cdf, 0);
    const cfUSD = manualCarryForwardUSD !== '' ? parseFloat(manualCarryForwardUSD || '0') : 0;
    const cfCDF = manualCarryForwardCDF !== '' ? parseFloat(manualCarryForwardCDF || '0') : 0;
    const totalGenUSD = totalDimesUSD + totalOffUSD + cfUSD;
    const totalGenCDF = totalDimesCDF + totalOffCDF + cfCDF;
    const totalSortiesUSD = sorties.filter(r => r.currency === 'USD').reduce((s, r) => s + r.amount, 0);
    const totalSortiesCDF = sorties.filter(r => r.currency === 'CDF').reduce((s, r) => s + r.amount, 0);
    const soldeUSD = totalGenUSD - totalSortiesUSD;
    const soldeCDF = totalGenCDF - totalSortiesCDF;

    const SubtotalRow = ({ label, usd, cdf, dark }: { label: string; usd: number; cdf: number; dark?: boolean }) => (
        <tr className={dark ? 'bg-slate-800 text-white' : 'bg-slate-50/80 print:bg-white'}>
            <td colSpan={2} className={`p-4 text-right font-black text-[10px] uppercase tracking-widest ${dark ? 'text-slate-200' : 'text-slate-500'}`}>{label}</td>
            <td className={`p-4 text-right font-serif font-black text-sm ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>{usd > 0 ? `$ ${usd.toLocaleString('fr-FR')}` : '–'}</td>
            <td className={`p-4 text-right font-serif font-black text-sm ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{cdf > 0 ? `FC ${cdf.toLocaleString('fr-FR')}` : '–'}</td>
        </tr>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-900">

            {/* Non-print toolbar */}
            <div className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-dark p-4 flex items-center justify-between shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-slate-500" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" /> Rapport Caisse Hebdomadaire
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-dark">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium outline-none text-slate-700 dark:text-slate-300" />
                        <span className="text-slate-400">au</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium outline-none text-slate-700 dark:text-slate-300" />
                    </div>
                    <Button onClick={() => window.print()} className="bg-primary text-white gap-2 rounded-lg text-sm px-6">
                        <PrinterIcon className="w-4 h-4" /> Imprimer
                    </Button>
                </div>
            </div>

            {/* Printable content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:bg-white custom-scrollbar bg-slate-100 dark:bg-slate-900">
                <div className="max-w-[1100px] mx-auto bg-white p-10 md:p-16 print:p-8 shadow-admin print:shadow-none min-h-screen text-slate-800">
                    <style>{`@media print { @page { size: portrait; margin: 15mm; } body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`}</style>

                    {/* Letterhead */}
                    <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-slate-100">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-white font-black text-2xl shadow-md">NCD</div>
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

                    {/* Title */}
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight uppercase mb-3">Rapport Caisse Semaine</h2>
                        <span className="inline-block px-5 py-2 bg-slate-100 print:border print:border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-full">
                            Du {fmtDate(startDate)} au {fmtDate(endDate)}
                        </span>
                    </div>

                    {/* ── TABLE 1: DÎMES & OFFRANDES ── */}
                    <div className="mb-14">
                        <div className="bg-slate-50 print:bg-white px-6 py-4 border-b-2 border-slate-200 rounded-t-xl">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 print:hidden"></span>
                                1. Recettes — Dîmes &amp; Offrandes
                            </h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="p-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest w-[25%]">Date</th>
                                    <th className="p-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">Libellé</th>
                                    <th className="p-4 text-right font-black text-emerald-600/70 text-[10px] uppercase tracking-widest w-[18%]">Montant USD</th>
                                    <th className="p-4 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest w-[18%]">Montant CDF</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 border-b border-slate-200">

                                {/* ── DÎMES ── */}
                                {dimesRows.map((r, i) => (
                                    <tr key={`d${i}`} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-xs font-black text-slate-500 uppercase">{fmtDay(r.date)}</td>
                                        <td className="p-4 text-xs font-bold text-slate-800 uppercase">{r.label}</td>
                                        <td className="p-4 text-right font-serif font-bold text-emerald-700">{r.usd > 0 ? `$ ${r.usd.toLocaleString('fr-FR')}` : '–'}</td>
                                        <td className="p-4 text-right font-serif font-bold text-slate-700">{r.cdf > 0 ? `FC ${r.cdf.toLocaleString('fr-FR')}` : '–'}</td>
                                    </tr>
                                ))}

                                <SubtotalRow label="Total Dîmes" usd={totalDimesUSD} cdf={totalDimesCDF} />
                                <SubtotalRow label="Total Dîmes en Dollard" usd={totalDimesUSD} cdf={0} dark />

                                {/* ── OFFRANDES ── */}
                                {offrandesRows.map((r, i) => (
                                    <tr key={`o${i}`} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-xs font-black text-slate-500 uppercase">{r.showDate ? fmtDay(r.date) : ''}</td>
                                        <td className="p-4 text-xs font-bold text-slate-800 uppercase">{r.label}</td>
                                        <td className="p-4 text-right font-serif font-bold text-emerald-700">{r.usd > 0 ? `$ ${r.usd.toLocaleString('fr-FR')}` : '–'}</td>
                                        <td className="p-4 text-right font-serif font-bold text-slate-700">{r.cdf > 0 ? `FC ${r.cdf.toLocaleString('fr-FR')}` : '–'}</td>
                                    </tr>
                                ))}

                                <SubtotalRow label="Total Offrandes" usd={totalOffUSD} cdf={totalOffCDF} />

                                {/* ── REPORT SEMAINE PASSÉE ── */}
                                <tr className="bg-white">
                                    <td colSpan={2} className="p-4 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest">Report Semaine Passée</td>
                                    <td className="p-4 text-right">
                                        <input type="number" value={manualCarryForwardUSD} onChange={e => setManualCarryForwardUSD(e.target.value)}
                                            placeholder="0" className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-serif font-black text-slate-700 focus:border-primary outline-none print:hidden" />
                                        <span className="hidden print:inline font-serif font-bold text-slate-500 text-sm">{cfUSD > 0 ? `$ ${cfUSD.toLocaleString('fr-FR')}` : '–'}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <input type="number" value={manualCarryForwardCDF} onChange={e => setManualCarryForwardCDF(e.target.value)}
                                            placeholder="0" className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-serif font-black text-slate-700 focus:border-primary outline-none print:hidden" />
                                        <span className="hidden print:inline font-serif font-bold text-slate-500 text-sm">{cfCDF > 0 ? `FC ${cfCDF.toLocaleString('fr-FR')}` : '–'}</span>
                                    </td>
                                </tr>

                                {/* ── TOTAL GÉNÉRAL ── */}
                                <tr className="bg-slate-100/60 print:bg-slate-50 border-y-2 border-slate-200">
                                    <td colSpan={2} className="p-5 text-right font-black text-slate-900 text-[11px] uppercase tracking-widest">Total Général Dîmes et Offrandes</td>
                                    <td className="p-5 text-right font-serif font-black text-emerald-800 text-base">{totalGenUSD > 0 ? `$ ${totalGenUSD.toLocaleString('fr-FR')}` : '–'}</td>
                                    <td className="p-5 text-right font-serif font-black text-slate-900 text-base">{totalGenCDF > 0 ? `FC ${totalGenCDF.toLocaleString('fr-FR')}` : '–'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ── TABLE 2: SORTIES DE CAISSE ── */}
                    <div className="mb-14">
                        <div className="bg-slate-50 print:bg-white px-6 py-4 border-b-2 border-slate-200 rounded-t-xl">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-red-400 print:hidden"></span>
                                2. Les Sorties de Caisse
                            </h3>
                        </div>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                                {sorties.map((r, i) => (
                                    <tr key={`s${i}`} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-xs font-black text-slate-500 w-[25%] uppercase">{fmtDay(r.date)}</td>
                                        <td className="p-4 text-xs font-bold text-slate-800 uppercase">{(r.notes || r.description || r.type || '').toUpperCase()}</td>
                                        <td className="p-4 text-right font-serif font-bold text-slate-600 w-[18%]">{r.currency === 'USD' ? `$ ${r.amount.toLocaleString('fr-FR')}` : '–'}</td>
                                        <td className="p-4 text-right font-serif font-bold text-slate-600 w-[18%]">{r.currency === 'CDF' ? `FC ${r.amount.toLocaleString('fr-FR')}` : '–'}</td>
                                    </tr>
                                ))}
                                {sorties.length < 2 && Array.from({ length: 2 - sorties.length }).map((_, i) => (
                                    <tr key={`se${i}`} className="h-14"><td className="p-4"></td><td className="p-4"></td><td className="p-4"></td><td className="p-4"></td></tr>
                                ))}
                                {/* Total Sortie */}
                                <tr className="bg-slate-100/60 print:bg-slate-50 border-y-2 border-slate-200">
                                    <td colSpan={2} className="p-5 text-right font-black text-slate-900 text-[11px] uppercase tracking-widest">Total Sortie</td>
                                    <td className="p-5 text-right font-serif font-black text-red-700/80 text-base">{totalSortiesUSD > 0 ? `$ ${totalSortiesUSD.toLocaleString('fr-FR')}` : '–'}</td>
                                    <td className="p-5 text-right font-serif font-black text-red-600 text-base">{totalSortiesCDF > 0 ? `FC ${totalSortiesCDF.toLocaleString('fr-FR')}` : '–'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ── SOLDE CAISSE ── */}
                    <div className="bg-slate-900 text-white rounded-lg p-8 flex flex-col md:flex-row justify-between items-center mb-16 print:bg-white print:text-black print:border-4 print:border-slate-900 shadow-xl print:shadow-none relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl print:hidden"></div>
                        <div className="relative z-10 text-center md:text-left">
                            <p className="text-[10px] text-slate-400 print:text-slate-500 font-black uppercase tracking-widest mb-1">Solde Caisse du {fmtDate(startDate)} au {fmtDate(endDate)}</p>
                            <p className="text-sm font-medium text-slate-300 print:text-slate-800">Bilan arrêté au {fmtDate(endDate)}</p>
                        </div>
                        <div className="flex gap-12 mt-6 md:mt-0 text-center md:text-right relative z-10 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-12">
                            <div>
                                <p className="text-[10px] text-emerald-400 print:text-slate-500 font-bold uppercase tracking-widest mb-2">Solde USD</p>
                                <p className="text-3xl font-serif font-black text-white print:text-slate-900">$ {soldeUSD.toLocaleString('fr-FR')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-primary print:text-slate-500 font-bold uppercase tracking-widest mb-2">Solde CDF</p>
                                <p className="text-3xl font-serif font-black text-white print:text-slate-900">FC {soldeCDF.toLocaleString('fr-FR')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="pt-8 px-4">
                        <div className="grid grid-cols-3 gap-12 text-center">
                            {['La Trésorerie', "L'Administration", 'Le Pasteur Principal'].map(label => (
                                <div key={label}>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-24">{label}</p>
                                    <div className="border-t-2 border-slate-300 w-full pt-3">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nom &amp; Signature</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WeeklyFinanceReport;
