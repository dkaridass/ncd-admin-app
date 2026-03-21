import React from 'react';
import Card from '../ui/Card';
import { DollarSignIcon, TrendingUpIcon } from '../icons/Icons';

interface FinanceSummary {
    income: { usd: number; cdf: number };
    expenses: { usd: number; cdf: number };
    balance: { usd: number; cdf: number };
}

interface Props {
    summary: FinanceSummary;
    previousPeriod?: FinanceSummary;
    periodLabel: string;
}

const FinanceReportsSummary: React.FC<Props> = ({ summary, previousPeriod, periodLabel }) => {
    // Calculate trends
    const incomeTrend = previousPeriod
        ? ((summary.income.usd - previousPeriod.income.usd) / previousPeriod.income.usd) * 100
        : 0;

    const expensesTrend = previousPeriod
        ? ((summary.expenses.usd - previousPeriod.expenses.usd) / previousPeriod.expenses.usd) * 100
        : 0;

    const formatCurrency = (amount: number, currency: 'USD' | 'CDF') => {
        return currency === 'USD'
            ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : `FC ${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const summaryCards = [
        {
            label: 'Revenus Totaux',
            usd: summary.income.usd,
            cdf: summary.income.cdf,
            color: 'bg-emerald-500',
            trend: incomeTrend,
            icon: DollarSignIcon,
        },
        {
            label: 'Dépenses Totales',
            usd: summary.expenses.usd,
            cdf: summary.expenses.cdf,
            color: 'bg-red-500',
            trend: expensesTrend,
            icon: DollarSignIcon,
        },
        {
            label: 'Solde Net',
            usd: summary.balance.usd,
            cdf: summary.balance.cdf,
            color: summary.balance.usd >= 0 ? 'bg-blue-500' : 'bg-orange-500',
            trend: 0,
            icon: DollarSignIcon,
        }
    ];

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-700 dark:text-white">Résumé - {periodLabel}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summaryCards.map((card, index) => (
                    <Card key={index} className="border-none shadow-soft dark:shadow-none rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                {card.label}
                            </p>
                            <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* USD Amount */}
                        <div className="mb-3">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black text-primary dark:text-white">
                                    {formatCurrency(card.usd, 'USD')}
                                </h3>
                                {card.trend !== 0 && (
                                    <div className={`flex items-center text-xs font-bold ${card.trend > 0 ? 'text-emerald-600' : 'text-red-600' }`}>
                                        <TrendingUpIcon
                                            className={`w-3 h-3 mr-1 ${card.trend < 0 ? 'transform rotate-180' : ''}`}
                                        />
                                        {Math.abs(card.trend).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-1">USD</p>
                        </div>

                        {/* CDF Amount */}
                        <div className="pt-3 border-t border-slate-100 dark:border-dark">
                            <p className="text-lg font-bold text-slate-600 dark:text-slate-400">
                                {formatCurrency(card.cdf, 'CDF')}
                            </p>
                            <p className="text-xs text-slate-400 font-medium mt-1">Francs Congolais</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default FinanceReportsSummary;
