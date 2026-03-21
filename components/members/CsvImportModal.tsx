import React, { useState, useCallback } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import * as XLSX from 'xlsx';
import { parseCsvText, validateAndTransform, CsvParseResult, CsvValidationResult } from '../../utils/csvHelpers';
import { Member } from '../../types';
import { showSuccess, showError } from '../../utils/toast';

interface CsvImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingMembers: Member[];
    onImport: (members: Partial<Member>[]) => Promise<void>;
}

type Step = 'UPLOAD' | 'PREVIEW' | 'IMPORTING' | 'DONE';

const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, existingMembers, onImport }) => {
    const [step, setStep] = useState<Step>('UPLOAD');
    const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
    const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0, failed: 0 });
    const [fileName, setFileName] = useState('');

    const reset = () => {
        setStep('UPLOAD');
        setParseResult(null);
        setValidationResult(null);
        setImportProgress({ done: 0, total: 0, failed: 0 });
        setFileName('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        const reader = new FileReader();

        reader.onload = (event) => {
            let text = '';

            if (isExcel) {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    text = XLSX.utils.sheet_to_csv(worksheet);
                } catch (err) {
                    showError('Erreur de lecture du fichier Excel');
                    return;
                }
            } else {
                text = event.target?.result as string;
            }

            if (!text || text.trim() === '') {
                showError('Fichier vide ou illisible');
                return;
            }

            const parsed = parseCsvText(text);
            if (parsed.rows.length === 0) {
                showError('Aucune donnée trouvée dans le fichier');
                return;
            }

            setParseResult(parsed);

            // Build existing sets for duplicate detection
            const existingPhones = new Set<string>(existingMembers.map((m: Member) => m.phone?.replace(/\s/g, '') || '').filter((x): x is string => !!x));
            const existingEmails = new Set<string>(existingMembers.map((m: Member) => m.email?.toLowerCase() || '').filter((x): x is string => !!x));

            const validation = validateAndTransform(parsed, existingPhones, existingEmails);
            setValidationResult(validation);
            setStep('PREVIEW');
        };

        if (isExcel) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    }, [existingMembers]);

    const handleImport = async () => {
        if (!validationResult || validationResult.valid.length === 0) return;

        setStep('IMPORTING');
        const total = validationResult.valid.length;
        setImportProgress({ done: 0, total, failed: 0 });

        const membersToImport = validationResult.valid.map(v => v.data);

        try {
            await onImport(membersToImport);
            setImportProgress({ done: total, total, failed: 0 });
            setStep('DONE');
            showSuccess(`✅ ${total} membre(s) importé(s) avec succès !`);
        } catch (e: any) {
            showError(`Erreur d'importation: ${e.message}`);
            setImportProgress(prev => ({ ...prev, failed: prev.total - prev.done }));
            setStep('DONE');
        }
    };

    const mappedCount = parseResult ? Object.values(parseResult.columnMapping).filter(Boolean).length : 0;
    const unmappedHeaders = parseResult ? parseResult.headers.filter(h => !parseResult.columnMapping[h]) : [];

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="📄 Import — Membres (CSV & Excel)">
            <div className="space-y-6 min-h-[300px]">

                {/* STEP 1: Upload */}
                {step === 'UPLOAD' && (
                    <div className="space-y-6">
                        <div className="border-2 border-dashed border-slate-200 dark:border-dark rounded-2xl p-10 text-center hover:border-primary/40 transition-colors">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">📄</span>
                            </div>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                Glissez un fichier CSV ici ou cliquez pour sélectionner
                            </p>
                            <p className="text-xs text-slate-400 mb-4">
                                Formats supportés : Excel (.xlsx, .xls), CSV, TSV
                            </p>
                            <input
                                type="file"
                                accept=".csv,.tsv,.txt,.xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="csv-file-input"
                            />
                            <label
                                htmlFor="csv-file-input"
                                className="inline-block px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:opacity-90 transition-opacity"
                            >
                                Choisir un Fichier
                            </label>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-5">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Colonnes reconnues automatiquement</p>
                            <div className="flex flex-wrap gap-2">
                                {['Nom', 'Téléphone', 'Email', 'Sexe', 'Adresse', 'Commune', 'Date de naissance', 'Rôle', 'Statut', 'WhatsApp', 'Référence', 'État civil', 'Baptisé'].map(col => (
                                    <span key={col} className="px-3 py-1 bg-white dark:bg-card-dark rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100 dark:border-dark">
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Preview */}
                {step === 'PREVIEW' && parseResult && validationResult && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-primary">{parseResult.rows.length}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lignes</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-emerald-600">{validationResult.valid.length}</p>
                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Valides</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-red-600">{validationResult.errors.length}</p>
                                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Erreurs</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-amber-600">{validationResult.duplicates.length}</p>
                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Doublons</p>
                            </div>
                        </div>

                        {/* Column Mapping */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4">
                            <p className="text-xs font-black text-indigo-700 mb-2">
                                {mappedCount}/{parseResult.headers.length} colonnes mappées automatiquement
                            </p>
                            {unmappedHeaders.length > 0 && (
                                <p className="text-[10px] text-amber-600 font-bold">
                                    ⚠️ Colonnes ignorées : {unmappedHeaders.join(', ')}
                                </p>
                            )}
                        </div>

                        {/* Errors list */}
                        {validationResult.errors.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 max-h-32 overflow-y-auto">
                                <p className="text-xs font-black text-red-600 mb-2">Erreurs détectées</p>
                                {validationResult.errors.map((err, i) => (
                                    <p key={i} className="text-[10px] text-red-500 font-medium">
                                        Ligne {err.row} • {err.field} — {err.message}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Duplicates list */}
                        {validationResult.duplicates.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 max-h-32 overflow-y-auto">
                                <p className="text-xs font-black text-amber-600 mb-2">Doublons détectés (seront importés malgré tout)</p>
                                {validationResult.duplicates.map((dup, i) => (
                                    <p key={i} className="text-[10px] text-amber-500 font-medium">
                                        Ligne {dup.row} • {dup.field} : {dup.value}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Preview table */}
                        <div className="border rounded-xl overflow-hidden">
                            <div className="overflow-x-auto max-h-48">
                                <table className="w-full text-[10px]">
                                    <thead className="bg-slate-50 dark:bg-white/[0.02] sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-black text-slate-400 uppercase">#</th>
                                            <th className="px-3 py-2 text-left font-black text-slate-400 uppercase">Nom</th>
                                            <th className="px-3 py-2 text-left font-black text-slate-400 uppercase">Tél</th>
                                            <th className="px-3 py-2 text-left font-black text-slate-400 uppercase">Email</th>
                                            <th className="px-3 py-2 text-left font-black text-slate-400 uppercase">Sexe</th>
                                            <th className="px-3 py-2 text-left font-black text-slate-400 uppercase">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-dark">
                                        {validationResult.valid.slice(0, 20).map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="px-3 py-2 text-slate-400">{row.rowIndex + 2}</td>
                                                <td className="px-3 py-2 font-bold text-slate-800 dark:text-white">{row.data.name}</td>
                                                <td className="px-3 py-2 text-slate-500">{row.data.phone || '—'}</td>
                                                <td className="px-3 py-2 text-slate-500">{row.data.email || '—'}</td>
                                                <td className="px-3 py-2 text-slate-500">{row.data.gender}</td>
                                                <td className="px-3 py-2">
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black">
                                                        {row.data.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {validationResult.valid.length > 20 && (
                                            <tr>
                                                <td colSpan={6} className="px-3 py-2 text-center text-slate-400 text-[10px]">
                                                    ... et {validationResult.valid.length - 20} de plus
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end">
                            <Button onClick={reset} variant="secondary" className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest">
                                ← Retour
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={validationResult.valid.length === 0}
                                className="rounded-xl px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest"
                            >
                                Importer {validationResult.valid.length} membre(s)
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Importing */}
                {step === 'IMPORTING' && (
                    <div className="text-center space-y-6 py-10">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        <div>
                            <p className="text-lg font-black text-primary">Importation en cours...</p>
                            <p className="text-sm text-slate-400 mt-2">
                                {importProgress.done}/{importProgress.total} membre(s) traité(s)
                            </p>
                        </div>
                    </div>
                )}

                {/* STEP 4: Done */}
                {step === 'DONE' && (
                    <div className="text-center space-y-6 py-10">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">{importProgress.failed > 0 ? '⚠️' : '✅'}</span>
                        </div>
                        <div>
                            <p className="text-lg font-black text-emerald-700">
                                {importProgress.failed > 0
                                    ? `${importProgress.done - importProgress.failed} importé(s), ${importProgress.failed} échoué(s)`
                                    : `${importProgress.done} membre(s) importé(s) avec succès !`
                                }
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                                Fichier : {fileName}
                            </p>
                        </div>
                        <Button onClick={handleClose} className="rounded-xl px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest">
                            Fermer
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default CsvImportModal;
