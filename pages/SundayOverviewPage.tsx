import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { AttendanceRecord, FinanceRecord } from '../types';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { CalendarIcon, UsersIcon, DollarSignIcon, TrashIcon } from '../components/icons/Icons';
import { showSuccess, showError } from '../utils/toast';
import PageTransition from '../components/layout/PageTransition';
import { Timestamp } from 'firebase/firestore';

// ... (existing code)

const EditServiceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  date: string;
}> = ({ isOpen, onClose, serviceName, date }) => {
  const {
    attendance, financeRecords,
    updateAttendance, addAttendance, deleteAttendance,
    updateFinanceRecord, deleteFinanceRecord, addFinanceRecord,
    isLoading
  } = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state for current records
  const currentAttendance = useMemo(() => {
    return attendance.find(a => a.date === date && normalizeServiceName(a.sessionName) === serviceName);
  }, [attendance, date, serviceName]);

  const currentFinances = useMemo(() => {
    return financeRecords.filter(f => f.date === date && normalizeServiceName(f.serviceName) === serviceName);
  }, [financeRecords, date, serviceName]);

  // Form States
  const [attForm, setAttForm] = useState({ men: 0, women: 0, children: 0, visitors: 0 });

  useEffect(() => {
    if (currentAttendance) {
      setAttForm({
        men: currentAttendance.menCount,
        women: currentAttendance.womenCount,
        children: currentAttendance.childrenCount,
        visitors: currentAttendance.visitorCount || 0
      });
    } else {
      setAttForm({ men: 0, women: 0, children: 0, visitors: 0 });
    }
  }, [currentAttendance]);

  const handleSaveAttendance = async () => {
    setIsSubmitting(true);
    try {
      if (currentAttendance) {
        await updateAttendance(currentAttendance.id, {
          menCount: attForm.men,
          womenCount: attForm.women,
          childrenCount: attForm.children,
          visitorCount: attForm.visitors,
          totalCount: attForm.men + attForm.women + attForm.children
        });
      } else {
        await addAttendance({
          date,
          sessionName: serviceName,
          menCount: attForm.men,
          womenCount: attForm.women,
          childrenCount: attForm.children,
          visitorCount: attForm.visitors,
          totalCount: attForm.men + attForm.women + attForm.children
        });
      }
      showSuccess("Présences mises à jour");
    } catch (e) {
      showError("Erreur lors de la mise à jour des présences");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finance Actions
  const handleUpdateFinance = async (id: string, amount: number) => {
    try {
      await updateFinanceRecord(id, { amount });
      showSuccess("Montant mis à jour");
    } catch (e) { showError("Erreur maj finance"); }
  };


  const handleDeleteAttendance = async () => {
    if (!currentAttendance) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rapport de présence ?")) {
      setIsSubmitting(true);
      try {
        await deleteAttendance(currentAttendance.id);
        showSuccess("Rapport supprimé");
        onClose();
      } catch (e) {
        showError("Erreur suppression");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Édition - ${serviceName} (${date})`}>
      <div className="space-y-8">

        {/* ATTENDANCE SECTION */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Présences</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500">Hommes</label>
              <input type="number" className="w-full p-2 border rounded-lg" value={attForm.men} onChange={e => setAttForm(p => ({ ...p, men: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Femmes</label>
              <input type="number" className="w-full p-2 border rounded-lg" value={attForm.women} onChange={e => setAttForm(p => ({ ...p, women: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Enfants</label>
              <input type="number" className="w-full p-2 border rounded-lg" value={attForm.children} onChange={e => setAttForm(p => ({ ...p, children: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Visiteurs</label>
              <input type="number" className="w-full p-2 border rounded-lg" value={attForm.visitors} onChange={e => setAttForm(p => ({ ...p, visitors: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            {currentAttendance && (
              <button
                onClick={handleDeleteAttendance}
                className="text-red-400 text-xs hover:text-red-600 hover:underline"
              >
                Supprimer ce rapport
              </button>
            )}
            <Button onClick={handleSaveAttendance} isLoading={isSubmitting} size="sm">Enregistrer Présences</Button>
          </div>
        </div>

        {/* FINANCES SECTION */}
        <div>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Finances ({currentFinances.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {currentFinances.map(record => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700">{record.type} <span className="text-slate-400 font-normal">({record.method})</span></p>
                  <p className="text-[10px] text-slate-400">{record.currency}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-24 p-1 text-right text-sm font-bold border rounded"
                    defaultValue={record.amount}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val !== record.amount) handleUpdateFinance(record.id, val);
                    }}
                  />
                  <button
                    onClick={() => {
                      if (confirm('Supprimer cette offrande ?')) deleteFinanceRecord(record.id);
                    }}
                    className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {currentFinances.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">Aucune offrande enregistrée.</p>}
          </div>
          {/* Simple Add Button could go here, but maybe user should use main finance page for adding new ones to filter correctly? 
                For now, let's keep it simple: edit/delete existing. Adding new complex records usually requires more fields (category, method, etc).
            */}
        </div>

      </div>
    </Modal>
  );
};




type ServiceSummary = {
  serviceName: string;
  attendance?: {
    total: number;
    men: number;
    women: number;
    youth: number;
    children: number;
    visitors: number;
  };
  offerings: {
    byType: Record<string, { CDF: number; USD: number }>;
    totals: { CDF: number; USD: number };
  };
};

type SundaySummary = {
  date: string; // YYYY-MM-DD
  label: string; // human readable
  services: ServiceSummary[];
  totals: {
    attendance: number;
    offeringsCDF: number;
    offeringsUSD: number;
  };
};

const normalizeServiceName = (raw?: string | null): string => {
  if (!raw) return 'Autre';
  if (raw.includes('1er')) return '1er Culte';
  if (raw.includes('2ème')) return '2ème Culte';
  if (raw.includes('3ème')) return '3ème Culte';
  if (raw.includes('Mercredi')) return 'Culte Mercredi';
  if (raw.includes('Vendredi')) return 'Culte Vendredi';
  return raw;
};

const SundayOverviewPage: React.FC = () => {
  const { attendance, financeRecords } = useData();
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'SUNDAY'>('ALL');
  const [editingService, setEditingService] = useState<{ name: string, date: string } | null>(null);


  const sundays: SundaySummary[] = useMemo(() => {
    const byDate: Record<string, SundaySummary> = {};

    const ensureSunday = (isoDate: string): SundaySummary => {
      if (!byDate[isoDate]) {
        const d = new Date(isoDate);
        byDate[isoDate] = {
          date: isoDate,
          label: d.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          services: [],
          totals: {
            attendance: 0,
            offeringsCDF: 0,
            offeringsUSD: 0
          }
        };
      }
      return byDate[isoDate];
    };

    const ensureService = (s: SundaySummary, serviceName: string): ServiceSummary => {
      let service = s.services.find(x => x.serviceName === serviceName);
      if (!service) {
        service = {
          serviceName,
          attendance: undefined,
          offerings: {
            byType: {},
            totals: { CDF: 0, USD: 0 }
          }
        };
        s.services.push(service);
      }
      return service;
    };

    // Attendance aggregation
    (attendance || []).forEach((rec: AttendanceRecord) => {
      const iso = rec.date;
      const sunday = ensureSunday(iso);
      const serviceName = normalizeServiceName(rec.sessionName);
      const service = ensureService(sunday, serviceName);

      if (!service.attendance) {
        service.attendance = {
          total: rec.totalCount,
          men: rec.menCount,
          women: rec.womenCount,
          youth: rec.youthCount || 0,
          children: rec.childrenCount,
          visitors: rec.visitorCount || 0
        };
        sunday.totals.attendance += rec.totalCount;
      }
    });

    // Offerings aggregation
    (financeRecords || []).forEach((rec: FinanceRecord) => {
      if (rec.type === 'Dépense') return;
      if (!rec.date || !rec.currency || !rec.amount) return;

      const iso = rec.date;
      const sunday = ensureSunday(iso);
      const serviceName = normalizeServiceName(rec.serviceName);
      const service = ensureService(sunday, serviceName);

      const key = rec.type;
      if (!service.offerings.byType[key]) {
        service.offerings.byType[key] = { CDF: 0, USD: 0 };
      }

      if (rec.currency === 'CDF') {
        service.offerings.byType[key].CDF += rec.amount;
        service.offerings.totals.CDF += rec.amount;
        sunday.totals.offeringsCDF += rec.amount;
      } else if (rec.currency === 'USD') {
        service.offerings.byType[key].USD += rec.amount;
        service.offerings.totals.USD += rec.amount;
        sunday.totals.offeringsUSD += rec.amount;
      }
    });

    // Sort services by typical Sunday order
    const serviceOrder = ['1er Culte', '2ème Culte', '3ème Culte'];

    const result = Object.values(byDate)
      .map(s => ({
        ...s,
        services: s.services.sort((a, b) => {
          const ia = serviceOrder.indexOf(a.serviceName);
          const ib = serviceOrder.indexOf(b.serviceName);
          if (ia === -1 && ib === -1) return a.serviceName.localeCompare(b.serviceName);
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        })
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [attendance, financeRecords]);

  const filteredSundays = useMemo(() => {
    if (serviceFilter === 'ALL') return sundays;
    return sundays.filter(s =>
      s.services.some(sv => sv.serviceName.includes('Culte'))
    );
  }, [sundays, serviceFilter]);

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary font-display tracking-tight leading-none mb-1 uppercase italic">
              Synthèse des Cultes
            </h2>
            <p className="text-slate-500 font-medium italic opacity-80 uppercase tracking-widest text-[9px]">
              Présence & Offrandes • Vue par Dimanche et par Culte
            </p>


            {editingService && (
              <EditServiceModal
                isOpen={!!editingService}
                onClose={() => setEditingService(null)}
                serviceName={editingService.name}
                date={editingService.date}
              />
            )}
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setServiceFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${serviceFilter === 'ALL'
                ? 'bg-white text-primary shadow-sm border border-primary/20'
                : 'bg-transparent text-slate-600 hover:text-primary hover:bg-slate-50'
                }`}
            >
              Tous
            </button>
            <button
              onClick={() => setServiceFilter('SUNDAY')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${serviceFilter === 'SUNDAY'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:text-primary hover:bg-slate-50'
                }`}
            >
              Dimanche
            </button>
          </div>
        </div>

        {filteredSundays.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[2rem] border border-slate-100">
            <p className="font-bold text-sm">Aucune donnée disponible</p>
            <p className="text-xs mt-1">
              Les cultes apparaîtront ici dès que des présences et des offrandes seront saisies.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredSundays.map(sunday => (
              <Card
                key={sunday.date}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        {sunday.date}
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {sunday.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white">
                      <UsersIcon className="w-4 h-4" />
                      <span className="font-black uppercase tracking-widest">
                        {sunday.totals.attendance.toLocaleString()} Présences
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <DollarSignIcon className="w-4 h-4" />
                      <span className="font-black uppercase tracking-widest">
                        FC {sunday.totals.offeringsCDF.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 text-amber-700">
                      <DollarSignIcon className="w-4 h-4" />
                      <span className="font-black uppercase tracking-widest">
                        $ {sunday.totals.offeringsUSD.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sunday.services.map(service => (
                    <div
                      key={service.serviceName}
                      className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 group relative"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black uppercase tracking-widest text-primary">
                            {service.serviceName}
                          </p>
                          <button
                            onClick={() => setEditingService({ name: service.serviceName, date: sunday.date })}
                            className="text-[9px] text-slate-400 hover:text-primary underline opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Modifier
                          </button>
                        </div>
                        <Badge variant="neutral" className="text-[9px] px-2 py-0.5">
                          {service.attendance
                            ? `${service.attendance.total.toLocaleString()} pers.`
                            : 'Présence manquante'}
                        </Badge>
                      </div>

                      {service.attendance && (
                        <div className="grid grid-cols-3 gap-2 mb-3 text-[10px] text-slate-500">
                          <div className="flex flex-col">
                            <span className="font-black uppercase tracking-widest text-blue-500">
                              H
                            </span>
                            <span className="font-bold">{service.attendance.men}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black uppercase tracking-widest text-pink-500">
                              F
                            </span>
                            <span className="font-bold">{service.attendance.women}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black uppercase tracking-widest text-emerald-500">
                              V
                            </span>
                            <span className="font-bold">
                              {service.attendance.visitors}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Offrandes par catégorie
                        </p>
                        {Object.keys(service.offerings.byType).length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            Aucune offrande enregistrée pour ce culte.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {Object.entries(service.offerings.byType).map(
                              ([type, amounts]: [string, { CDF: number; USD: number }]) => (
                                <div
                                  key={type}
                                  className="flex items-center justify-between text-[11px]"
                                >
                                  <span className="font-semibold text-slate-600">
                                    {type}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-500">
                                    {amounts.CDF > 0 && (
                                      <span className="mr-2">
                                        FC {amounts.CDF.toLocaleString()}
                                      </span>
                                    )}
                                    {amounts.USD > 0 && (
                                      <span>
                                        $ {amounts.USD.toLocaleString()}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {service.offerings.totals.CDF > 0 ||
                          service.offerings.totals.USD > 0 ? (
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Total
                            </span>
                            <span className="text-[11px] font-black text-primary">
                              {service.offerings.totals.CDF > 0 && (
                                <span className="mr-2">
                                  FC {service.offerings.totals.CDF.toLocaleString()}
                                </span>
                              )}
                              {service.offerings.totals.USD > 0 && (
                                <span>
                                  $ {service.offerings.totals.USD.toLocaleString()}
                                </span>
                              )}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default SundayOverviewPage;

