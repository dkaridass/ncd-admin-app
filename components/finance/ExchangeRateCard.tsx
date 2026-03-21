import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { currencyApiService } from '../../services/currencyApiService';

interface ExchangeRateCardProps {
    className?: string;
}

const ExchangeRateCard: React.FC<ExchangeRateCardProps> = ({ className = '' }) => {
    const [rate, setRate] = useState<number | null>(null);
    const [date, setDate] = useState<string>('');
    const [isCached, setIsCached] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchExchangeRate();
    }, []);

    const fetchExchangeRate = async () => {
        setIsLoading(true);
        setError(false);

        try {
            const rateData = await currencyApiService.getUsdToCdfRate();
            if (rateData) {
                setRate(rateData.rate);
                setDate(rateData.date);
                setIsCached(rateData.cached);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('Error fetching exchange rate:', err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-emerald-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-emerald-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    if (error || rate === null) {
        return (
            <div className={`bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200 ${className}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Taux USD/CDF</p>
                        <p className="text-sm text-gray-500">Données non disponibles</p>
                    </div>
                    <button
                        onClick={fetchExchangeRate}
                        className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 shadow-sm dark:shadow-none hover:shadow-md dark:shadow-none transition-shadow ${className}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            💱 Taux de Change
                        </p>
                        {isCached && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-bold">
                                CACHE
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-extrabold text-slate-800 dark:text-white">
                            {rate.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-emerald-600 font-bold">FC</p>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                        1 USD = {rate.toFixed(2)} CDF
                    </p>

                    <p className="text-[9px] text-slate-400 mt-1.5">
                        Mis à jour: {new Date(date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })}
                    </p>
                </div>

                <div className="flex flex-col items-end space-y-1">
                    <div className="bg-card dark:bg-card-dark p-2 rounded-lg border border-emerald-100">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <button
                        onClick={fetchExchangeRate}
                        className="text-[9px] text-emerald-600 hover:text-emerald-700 font-bold underline"
                        title="Actualiser le taux"
                    >
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Quick conversion examples */}
            <div className="mt-3 pt-3 border-t border-emerald-100">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-card dark:bg-card-dark p-1.5 rounded">
                        <p className="text-emerald-600 font-bold">$100 USD</p>
                        <p className="text-slate-600 dark:text-slate-400">{(rate * 100).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FC</p>
                    </div>
                    <div className="bg-card dark:bg-card-dark p-1.5 rounded">
                        <p className="text-emerald-600 font-bold">10,000 FC</p>
                        <p className="text-slate-600 dark:text-slate-400">${(10000 / rate).toFixed(2)} USD</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ExchangeRateCard;
