import React, { useState } from 'react';
import { FinanceRecord } from '../../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
    records: FinanceRecord[];
    periodLabel: string;
    summary: {
        income: { usd: number; cdf: number };
        expenses: { usd: number; cdf: number };
        balance: { usd: number; cdf: number };
    };
}

const ExportMenu: React.FC<Props> = ({ records, periodLabel, summary }) => {
    const [isOpen, setIsOpen] = useState(false);

    const exportToExcel = () => {
        // Create workbook
        const wb = XLSX.utils.book_new();

        // Summary sheet data
        const summaryData = [
            ['Rapport Financier - NCD La Pentecôte'],
            ['Période:', periodLabel],
            ['Date de génération:', new Date().toLocaleDateString('fr-FR')],
            [],
            ['Résumé Financier'],
            ['Catégorie', 'USD', 'CDF'],
            ['Revenus Totaux', summary.income.usd, summary.income.cdf],
            ['Dépenses Totales', summary.expenses.usd, summary.expenses.cdf],
            ['Solde Net', summary.balance.usd, summary.balance.cdf],
            [],
            ['Détail des Transactions'],
        ];

        // Transactions data
        const transactionsData = records.map(r => ({
            Date: r.date,
            Type: r.type,
            Montant: r.amount,
            Devise: r.currency,
            'Nom/Notes': r.memberName || r.notes || '-',
            'Session': r.serviceName || '-',
            'Enregistré par': r.recordedBy,
        }));

        // Add summary sheet
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

        // Add transactions sheet
        const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
        XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

        // Download
        XLSX.writeFile(wb, `Rapport_Finances_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsOpen(false);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Rapport Financier', 14, 20);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('NCD La Pentecôte', 14, 28);

        doc.setFontSize(10);
        doc.text(`Période: ${periodLabel}`, 14, 36);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 42);

        // Summary table
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Résumé Financier', 14, 54);

        autoTable(doc, {
            startY: 58,
            head: [['Catégorie', 'USD', 'CDF']],
            body: [
                ['Revenus Totaux', `$${summary.income.usd.toLocaleString()}`, `FC ${summary.income.cdf.toLocaleString()}`],
                ['Dépenses Totales', `$${summary.expenses.usd.toLocaleString()}`, `FC ${summary.expenses.cdf.toLocaleString()}`],
                ['Solde Net', `$${summary.balance.usd.toLocaleString()}`, `FC ${summary.balance.cdf.toLocaleString()}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 10 },
        });

        // Transactions table
        const finalY = (doc as any).lastAutoTable.finalY || 90;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Détail des Transactions', 14, finalY + 10);

        autoTable(doc, {
            startY: finalY + 14,
            head: [['Date', 'Type', 'Montant', 'Devise', 'Notes']],
            body: records.map(r => [
                r.date,
                r.type,
                r.amount.toLocaleString(),
                r.currency,
                r.memberName || r.notes || '-',
            ]),
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 8 },
        });

        // Download
        doc.save(`Rapport_Finances_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="rounded-xl px-6 py-3 bg-card dark:bg-card-dark border-2 border-slate-200 dark:border-dark text-slate-700 dark:text-white text-xs font-black uppercase tracking-widest hover:border-primary hover:text-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
                📥 Exporter
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-card dark:bg-card-dark rounded-2xl shadow-premium dark:shadow-none border border-slate-100 dark:border-dark overflow-hidden z-50">
                        <div className="p-2">
                            <button
                                onClick={exportToExcel}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-emerald-50 dark:bg-emerald-900/20 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="text-lg">📊</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">Exporter en Excel</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Format .xlsx</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={exportToPDF}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:bg-red-900/20 transition-colors group mt-1"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="text-lg">📄</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">Exporter en PDF</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Format imprimable</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportMenu;
