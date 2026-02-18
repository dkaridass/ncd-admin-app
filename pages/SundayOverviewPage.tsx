import React, { useMemo, useState } from 'react';
import PageTransition from '../components/layout/PageTransition';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import { AttendanceRecord, FinanceRecord } from '../types';
import { CalendarIcon, DollarSignIcon, UsersIcon } from '../components/icons/Icons';

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

      service.attendance = {
        total: rec.totalCount,
        men: rec.menCount,
        women: rec.womenCount,
        youth: rec.youthCount || 0,
        children: rec.childrenCount,
        visitors: rec.visitorCount || 0
      };

      sunday.totals.attendance += rec.totalCount;
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
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setServiceFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                serviceFilter === 'ALL'
                  ? 'bg-white text-primary shadow-sm border border-primary/20'
                  : 'bg-transparent text-slate-600 hover:text-primary hover:bg-slate-50'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setServiceFilter('SUNDAY')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                serviceFilter === 'SUNDAY'
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
                      className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-black uppercase tracking-widest text-primary">
                          {service.serviceName}
                        </p>
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
                              ([type, amounts]) => (
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

