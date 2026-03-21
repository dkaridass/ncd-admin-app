import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinanceRecord, Currency, TransactionType } from '../../types';
import Card from '../ui/Card';
import { ChevronDownIcon, DollarSignIcon, TrendingUpIcon } from '../icons/Icons';

interface ServiceSummaryProps {
    date: string;
    records: FinanceRecord[];
}

const ServiceSummary: React.FC<ServiceSummaryProps> = ({ date, records }) => {
    // Filter records for the specific date
    const dayRecords = records.filter(r => r.date === date);

    // Group by Service
    const services = ['1er Culte', '2ème Culte', '3ème Culte', 'Culte Mercredi', 'Culte Vendredi', 'Autre'];

    // Calculate totals per service
    const serviceStats = services.map(service => {
        const serviceRecords = dayRecords.filter(r => r.serviceName === service);
        const totalCDF = serviceRecords.filter(r => r.currency === 'CDF').reduce((acc, r) => acc + r.amount, 0);
        const totalUSD = serviceRecords.filter(r => r.currency === 'USD').reduce((acc, r) => acc + r.amount, 0);

        // Categorized totals
        const byCategory: Record<string, { CDF: number, USD: number }> = {};
        serviceRecords.forEach(r => {
            if (!byCategory[r.type]) byCategory[r.type] = { CDF: 0, USD: 0 };
            byCategory[r.type][r.currency] += r.amount;
        });

        return {
            name: service,
            records: serviceRecords,
            totalCDF,
            totalUSD,
            byCategory,
            hasData: serviceRecords.length > 0
        };
    }).filter(s => s.hasData);

    // Calculate Grand Total for the day
    const grandTotalCDF = dayRecords.filter(r => r.currency === 'CDF').reduce((acc, r) => acc + r.amount, 0);
    const grandTotalUSD = dayRecords.filter(r => r.currency === 'USD').reduce((acc, r) => acc + r.amount, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-700 dark:text-white uppercase tracking-tight">
                    Récapitulatif du {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Jour (CDF)</span>
                        <span className="text-2xl font-black text-emerald-700 font-display">{grandTotalCDF.toLocaleString()} FC</span>
                    </div>
                    <div className="px-6 py-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Jour (USD)</span>
                        <span className="text-2xl font-black text-blue-700 font-display">${grandTotalUSD.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {serviceStats.length === 0 ? (
                <Card className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-dark bg-slate-50 dark:bg-white/[0.02]/50">
                    <p className="text-slate-400 font-bold">Aucune donnée enregistrée pour cette date.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {serviceStats.map((service) => (
                        <ServiceCard key={service.name} service={service} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ServiceCard: React.FC<{ service: any }> = ({ service }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="overflow-hidden border border-slate-100 dark:border-dark hover:shadow-lg dark:shadow-none transition-all duration-300">
            <div
                className="p-6 bg-card dark:bg-card-dark flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${service.name.includes('Culte') ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 dark:text-slate-400'}`}>
                        <TrendingUpIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">{service.name}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{service.records.length} transactions</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total CDF</p>
                        <p className="text-xl font-black text-slate-700 dark:text-white">{service.totalCDF.toLocaleString()} FC</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total USD</p>
                        <p className="text-xl font-black text-slate-700 dark:text-white">${service.totalUSD.toLocaleString()}</p>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 dark:border-dark bg-slate-50 dark:bg-white/[0.02]/50"
                    >
                        <div className="p-6">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Catégorie</th>
                                        <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Montant CDF</th>
                                        <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Montant USD</th>
                                    </tr>
                                </thead>
                                <tbody className="space-y-2">
                                    {Object.entries(service.byCategory).map(([category, amounts]: [string, any]) => (
                                        <tr key={category} className="border-b border-slate-100 dark:border-dark last:border-0 hover:bg-card dark:bg-card-dark transition-colors">
                                            <td className="py-3 font-bold text-slate-700 dark:text-white pl-2 border-l-2 border-primary dark:border-white/20/20">{category}</td>
                                            <td className="py-3 text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                                                {amounts.CDF > 0 ? `${amounts.CDF.toLocaleString()} FC` : '-'}
                                            </td>
                                            <td className="py-3 text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                                                {amounts.USD > 0 ? `$${amounts.USD.toLocaleString()}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

export default ServiceSummary;
