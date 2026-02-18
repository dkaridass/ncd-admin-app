import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PageTransition from '../components/layout/PageTransition';
import { UsersIcon, PlusCircleIcon, TrendingUpIcon, CalendarIcon } from '../components/icons/Icons';
import { AttendanceRecord } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import AttendanceChart from '../components/analytics/AttendanceChart';

const AttendancePage: React.FC = () => {
    const { attendance, addAttendance, currentUser } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        sessionName: '1er Culte',
        menCount: '',
        womenCount: '',
        childrenCount: '',
        youthCount: '',
        visitorCount: '',
        notes: ''
    });

    const cultesDisponibles = [
        '1er Culte', '2ème Culte', '3ème Culte',
        'Culte Mercredi', 'Culte Vendredi', 'Séminaire', 'Autre'
    ];

    const calculateTotal = () => {
        return (parseInt(formData.menCount) || 0) +
            (parseInt(formData.womenCount) || 0) +
            (parseInt(formData.childrenCount) || 0) +
            (parseInt(formData.youthCount) || 0) +
            (parseInt(formData.visitorCount) || 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const total = calculateTotal();
            if (total === 0) {
                showError("Veuillez saisir au moins un effectif.");
                setIsSubmitting(false);
                return;
            }

            await addAttendance({
                date: formData.date,
                sessionName: formData.sessionName,
                menCount: parseInt(formData.menCount) || 0,
                womenCount: parseInt(formData.womenCount) || 0,
                childrenCount: parseInt(formData.childrenCount) || 0,
                youthCount: parseInt(formData.youthCount) || 0,
                visitorCount: parseInt(formData.visitorCount) || 0,
                totalCount: total,
                notes: formData.notes
            });

            showSuccess("✅ Rapport de présence enregistré !");
            setIsModalOpen(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                sessionName: '1er Culte',
                menCount: '',
                womenCount: '',
                childrenCount: '',
                youthCount: '',
                visitorCount: '',
                notes: ''
            });
        } catch (error: any) {
            console.error("Error saving attendance:", error);
            showError("Erreur lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortedRecords = [...(attendance || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <PageTransition>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
                <div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-primary font-display tracking-tight leading-none mb-1 uppercase italic">Présences</h2>
                    <p className="text-slate-500 font-medium italic opacity-80 uppercase tracking-widest text-[9px]">Suivi des Cultes • NCD La Pentecôte</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="rounded-xl px-6 py-4 bg-primary text-white text-[10px] uppercase font-black tracking-widest shadow-lg hover:scale-105 transition-transform">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Nouveau Rapport
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <UsersIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Total Fidèles (Mois)</h3>
                    <p className="text-4xl font-black font-display tracking-tight">
                        {sortedRecords.slice(0, 4).reduce((acc, r) => acc + r.totalCount, 0).toLocaleString()}
                    </p>
                </Card>
                <Card className="p-6 bg-white border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Dernier Culte</h3>
                    {sortedRecords[0] ? (
                        <div>
                            <p className="text-3xl font-black text-slate-800 font-display mb-1">{sortedRecords[0].totalCount}</p>
                            <p className="text-xs font-bold text-slate-500">{sortedRecords[0].sessionName} • {new Date(sortedRecords[0].date).toLocaleDateString('fr-FR')}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 font-medium">Aucune donnée</p>
                    )}
                </Card>
                <Card className="p-6 bg-white border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Tendances</h3>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg w-fit">
                        <TrendingUpIcon className="w-4 h-4" />
                        <span className="text-xs font-bold">+5% vs mois dernier</span>
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="mb-8 h-96">
                <AttendanceChart />
            </div>

            {/* Attendance List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Historique des Rapports</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Session</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-blue-500">H</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-pink-500">F</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-purple-500">J</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-orange-500">E</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-500">V</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">
                                        {new Date(record.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${record.sessionName.includes('1er') ? 'bg-blue-50 text-blue-600' :
                                            record.sessionName.includes('2ème') ? 'bg-purple-50 text-purple-600' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                            {record.sessionName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-black text-sm">
                                            {record.totalCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{record.menCount}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{record.womenCount}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{record.youthCount || '-'}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{record.childrenCount}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{record.visitorCount || '-'}</td>
                                </tr>
                            ))}
                            {sortedRecords.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Aucun rapport de présence enregistré.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Rapport de Présence">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Session</label>
                            <select
                                value={formData.sessionName}
                                onChange={e => setFormData({ ...formData, sessionName: e.target.value })}
                                className="block w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 font-bold text-sm text-slate-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                            >
                                {cultesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Input label="Hommes" type="number" value={formData.menCount} onChange={e => setFormData({ ...formData, menCount: e.target.value })} placeholder="0" className="bg-blue-50/50 border-blue-100 focus:border-blue-500" />
                        <Input label="Femmes" type="number" value={formData.womenCount} onChange={e => setFormData({ ...formData, womenCount: e.target.value })} placeholder="0" className="bg-pink-50/50 border-pink-100 focus:border-pink-500" />
                        <Input label="Jeunes" type="number" value={formData.youthCount} onChange={e => setFormData({ ...formData, youthCount: e.target.value })} placeholder="0" className="bg-purple-50/50 border-purple-100 focus:border-purple-500" />
                        <Input label="Enfants" type="number" value={formData.childrenCount} onChange={e => setFormData({ ...formData, childrenCount: e.target.value })} placeholder="0" className="bg-orange-50/50 border-orange-100 focus:border-orange-500" />
                        <Input label="Visiteurs" type="number" value={formData.visitorCount} onChange={e => setFormData({ ...formData, visitorCount: e.target.value })} placeholder="0" className="bg-emerald-50/50 border-emerald-100 focus:border-emerald-500" />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total Calculé</span>
                        <span className="text-2xl font-black text-primary font-display">{calculateTotal()}</span>
                    </div>

                    <Input label="Notes (Optionnel)" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Remarques particulières..." />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button type="submit" isLoading={isSubmitting}>Enregistrer</Button>
                    </div>
                </form>
            </Modal>
        </PageTransition>
    );
};

export default AttendancePage;
