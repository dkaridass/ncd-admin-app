
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import PageTransition from '../components/layout/PageTransition';
import PermissionGuard from '../components/auth/PermissionGuard';
import { CalendarIcon, PlusCircleIcon, SparklesIcon, FileTextIcon } from '../components/icons/Icons';
import CalendarGrid from '../components/events/CalendarGrid';
import { Event, WeeklyService } from '../types';
import { initializeProgramme } from '../utils/initializeProgramme';
import { ensureSuperAdminExists } from '../utils/ensureSuperAdmin';
import { showSuccess, showError, showInfo } from '../utils/toast';

const EventsPage: React.FC = () => {
  const dataContext = useData();
  // Safely destructure with defaults
  const events = dataContext.events || [];
  const weeklyServices = dataContext.weeklyServices || [];
  const annualProgramme = dataContext.annualProgramme || [];
  const { hasPermission, currentUser } = dataContext;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tous' | 'prochains' | 'archives' | 'hebdomadaire' | 'annuel'>('tous');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isInitializing, setIsInitializing] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const { confirmState, confirm, cancelConfirm } = useConfirm();

  // Event Form State
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    type: 'Culte',
    start: new Date(),
    end: new Date(),
    location: 'Paroisse La Pentecôte',
    description: ''
  });

  // Attendance Form State
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    sessionName: '1er Culte',
    menCount: 0,
    womenCount: 0,
    childrenCount: 0
  });

  const filteredEvents = (events && Array.isArray(events) ? events : []).filter(event => {
    if (activeTab === 'archives') return new Date(event.end) < new Date();
    if (activeTab === 'prochains') return new Date(event.end) >= new Date();
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => a.start.getTime() - b.start.getTime());

  const handleDayClick = (date: Date) => {
    // Logic to add event on this day
    console.log("Add event on", date);
  };

  const handleEventClick = (event: Event) => {
    // Logic to edit event
    console.log("Edit event", event);
  };

  const handleInitializeProgramme = async () => {
    // Check if user has required permissions
    if (!currentUser) {
      showError('❌ Vous devez être connecté pour initialiser le programme.');
      return;
    }

    const allowedRoles = ['SUPER_ADMIN', 'PASTOR', 'STAFF_ADMIN'];
    if (!allowedRoles.includes(currentUser.role)) {
      showError(
        `❌ Permissions insuffisantes.\n\n` +
        `Votre rôle actuel: ${currentUser.role}\n` +
        `Rôles autorisés: SUPER_ADMIN, PASTOR, STAFF_ADMIN\n\n` +
        `Contactez un Super Administrateur pour corriger votre rôle.`
      );
      return;
    }

    const accepted = await confirm({
      title: 'Initialiser le Programme ?',
      message: 'Cette action créera les services hebdomadaires et les 13 événements annuels du Programme 2026.',
      confirmLabel: 'Initialiser',
      variant: 'info',
    });
    if (!accepted) {
      return;
    }

    setIsInitializing(true);
    try {
      const result = await initializeProgramme();
      showSuccess(`✅ Programme initialisé avec succès!\n- ${result.weeklyServices} services hebdomadaires\n- ${result.annualEvents} événements annuels 2026`);
      // Refresh the page to show new data
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      console.error('Error initializing programme:', error);

      // More detailed error message
      let errorMessage = error.message || 'Erreur inconnue';
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        errorMessage = `Permissions insuffisantes.\n\nVotre rôle: ${currentUser.role}\n\nVérifiez que votre rôle dans Firestore est SUPER_ADMIN et que les règles sont déployées.`;
      }

      showError(`❌ Erreur lors de l'initialisation:\n\n${errorMessage}\n\nVérifiez la console pour plus de détails.`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newEvent.title || !newEvent.start || !newEvent.end) {
        showError("Veuillez remplir les champs obligatoires");
        return;
      }

      await dataContext.addEvent({
        ...newEvent,
        id: Date.now().toString(), // Temp ID, will be replaced by Firestore
      } as Event);

      setIsEventModalOpen(false);
      showSuccess("Événement créé avec succès !");
      setNewEvent({ title: '', type: 'Culte', start: new Date(), end: new Date(), location: 'Paroisse La Pentecôte', description: '' });
    } catch (error: any) {
      showError("Erreur lors de la création de l'événement");
    }
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total = Number(attendanceForm.menCount) + Number(attendanceForm.womenCount) + Number(attendanceForm.childrenCount);
      await dataContext.addAttendance({
        id: Date.now().toString(),
        ...attendanceForm,
        totalCount: total
      });
      setIsAttendanceModalOpen(false);
      showSuccess("Effectifs enregistrés avec succès !");
      setAttendanceForm({
        date: new Date().toISOString().split('T')[0],
        sessionName: '1er Culte',
        menCount: 0,
        womenCount: 0,
        childrenCount: 0
      });
    } catch (error) {
      showError("Erreur lors de l'enregistrement des effectifs");
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary dark:text-white font-display tracking-tight leading-none mb-3 uppercase italic">Agenda Visionnaire</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic opacity-80 uppercase tracking-widest text-[10px]">Planification Stratégique</p>
        </div>
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center overflow-x-auto hide-scrollbar max-w-full">
            <button
              onClick={() => setViewMode('calendar')}
              className={`whitespace-nowrap px-4 md:px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Calendrier
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`whitespace-nowrap px-4 md:px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Liste
            </button>
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="ml-1 md:ml-2 whitespace-nowrap px-4 md:px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary dark:text-white hover:bg-card dark:bg-card-dark transition-all"
            >
              Saisir Effectifs
            </button>
          </div>
          <PermissionGuard permission="MANAGE_EVENTS">
            <Button onClick={() => setIsEventModalOpen(true)} className="rounded-lg px-8 py-3 bg-primary text-white w-full xl:w-auto">
              <PlusCircleIcon className="w-5 h-5 mr-3" />
              Nouvel Événement
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tabs for Programme Sections */}
      <div className="flex gap-2 mb-8 border-b border-slate-100 dark:border-dark overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('tous')}
          className={`whitespace-nowrap px-4 md:px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'tous' ? 'border-primary dark:border-white/20 text-primary dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
        >
          Tous les Événements
        </button>
        <button
          onClick={() => setActiveTab('hebdomadaire')}
          className={`whitespace-nowrap px-4 md:px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'hebdomadaire' ? 'border-primary dark:border-white/20 text-primary dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
        >
          Programme Hebdo
        </button>
        <button
          onClick={() => setActiveTab('annuel')}
          className={`whitespace-nowrap px-4 md:px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'annuel' ? 'border-primary dark:border-white/20 text-primary dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
        >
          Programme Annuel
        </button>
        <button
          onClick={() => setActiveTab('prochains')}
          className={`whitespace-nowrap px-4 md:px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'prochains' ? 'border-primary dark:border-white/20 text-primary dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
        >
          Prochains
        </button>
        <button
          onClick={() => setActiveTab('archives')}
          className={`whitespace-nowrap px-4 md:px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'archives' ? 'border-primary dark:border-white/20 text-primary dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
        >
          Archives
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-3/4">
          {activeTab === 'hebdomadaire' ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-primary dark:text-white uppercase mb-6">Programme Hebdomadaire</h3>
              {(weeklyServices && Array.isArray(weeklyServices) ? weeklyServices.length : 0) === 0 ? (
                <Card className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-dark">
                  <p className="text-slate-400 mb-2 text-lg font-bold">Aucun service hebdomadaire configuré</p>
                  <p className="text-sm text-slate-400 mb-6">Les services hebdomadaires doivent être initialisés</p>
                  {hasPermission('MANAGE_DEPARTMENTS') && (
                    <Button
                      onClick={handleInitializeProgramme}
                      disabled={isInitializing}
                      className="bg-primary text-white rounded-lg px-8 py-3 uppercase font-black tracking-widest text-[10px] disabled:opacity-50"
                    >
                      {isInitializing ? 'Initialisation...' : 'Initialiser les Services Hebdomadaires'}
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="space-y-4">
                  {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => {
                    const dayServices = (weeklyServices && Array.isArray(weeklyServices) ? weeklyServices : []).filter(s => s.dayOfWeek === day && s.isActive);
                    if (dayServices.length === 0) return null;
                    return (
                      <Card key={day} className="p-6 rounded-lg bg-white shadow-admin border border-slate-200 hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200">
                            <span className="text-xs font-black text-slate-500 uppercase">{day.substring(0, 3)}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-black text-primary dark:text-white uppercase mb-3">{day}</h4>
                            <div className="space-y-2">
                              {dayServices.map(service => (
                                <div key={service.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02] rounded-lg">
                                  <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{service.serviceName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{service.description || service.location}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-black text-primary dark:text-white">{service.startTime} - {service.endTime}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'annuel' ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-primary dark:text-white uppercase mb-6">Programme Annuel 2026 - FOCUS SUR JÉSUS</h3>
              {(annualProgramme && Array.isArray(annualProgramme) ? annualProgramme : []).filter(e => e.year === 2026 && e.isActive).length === 0 ? (
                <Card className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-dark">
                  <p className="text-slate-400 mb-2 text-lg font-bold">Aucun événement annuel 2026 configuré</p>
                  <p className="text-sm text-slate-400 mb-6">Le programme annuel 2026 doit être initialisé</p>
                  {hasPermission('MANAGE_DEPARTMENTS') && (
                    <Button
                      onClick={handleInitializeProgramme}
                      isLoading={isInitializing}
                      disabled={isInitializing}
                      className="bg-primary text-white rounded-lg px-8 py-3 uppercase font-black tracking-widest text-[10px] disabled:opacity-50"
                    >
                      Initialiser le Programme (Hebdomadaire + Annuel 2026)
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="space-y-4">
                  {(annualProgramme && Array.isArray(annualProgramme) ? annualProgramme : [])
                    .filter(e => e.year === 2026 && e.isActive)
                    .map(event => {
                      const startDate = new Date(event.startDate);
                      const endDate = new Date(event.endDate);
                      const isSameDay = event.startDate === event.endDate;
                      return (
                        <Card key={event.id} className="p-6 rounded-lg bg-white shadow-admin border border-slate-200 hover:border-primary/20 transition-all hover:shadow-md">
                          <div className="flex items-start gap-6">
                            <div className="w-16 h-16 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-200">
                              <span className="text-[10px] font-black text-slate-400 uppercase">
                                {startDate.toLocaleDateString('fr-FR', { month: 'short' })}
                              </span>
                              <span className="text-xl font-black font-display text-slate-700">
                                {startDate.getDate()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-black text-primary dark:text-white uppercase italic mb-2">{event.title}</h4>
                              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                <span className="flex items-center gap-2">
                                  <CalendarIcon className="w-4 h-4" />
                                  {isSameDay
                                    ? startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : `${startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                  }
                                </span>
                                {event.location && (
                                  <span className="flex items-center gap-2">
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    {event.location}
                                  </span>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
                              )}
                              {event.category && (
                                <Badge variant="secondary" className="mt-3 text-[9px] px-3 py-1">
                                  {event.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          ) : viewMode === 'calendar' ? (
            <CalendarGrid
              events={events}
              currentDate={currentDate}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          ) : (
            <div className="space-y-4">
              {sortedEvents.map(event => (
                <Card key={event.id} className="group p-6 rounded-lg bg-white shadow-admin border border-slate-200 hover:border-primary/20 transition-all hover:shadow-md flex justify-between items-center cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                        {event.start.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                      <span className="text-xl font-black font-display text-slate-700 group-hover:text-white">
                        {event.start.getDate()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-primary dark:text-white uppercase italic mb-2 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={event.type === 'Culte' ? 'primary' : 'secondary'} className="px-4 py-2 rounded-lg text-[9px] font-black uppercase">
                      {event.type}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-1/4 space-y-8">
          {/* Prochain Culte Highlight */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-admin relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-6">Prochain Culte</h3>

              {(() => {
                // Try to find next service from weekly services
                const now = new Date();
                const currentDay = now.getDay();
                const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                const dayOrder = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

                // Find next service from weekly schedule
                let nextServiceDate: Date | null = null;
                let nextService: WeeklyService | null = null;
                for (let i = 0; i < 7; i++) {
                  const checkDay = (currentDay + i) % 7;
                  const dayName = days[checkDay];
                  const dayServices = (weeklyServices && Array.isArray(weeklyServices) ? weeklyServices : []).filter(s => s.dayOfWeek === dayName && s.isActive).sort((a, b) => (a.order || 0) - (b.order || 0));
                  if (dayServices.length > 0) {
                    if (i === 0) {
                      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                      const futureService = dayServices.find(s => s.startTime > currentTime);
                      if (futureService) {
                        nextService = futureService;
                        nextServiceDate = new Date(now);
                        const [hours, mins] = futureService.startTime.split(':').map(Number);
                        nextServiceDate.setHours(hours, mins, 0, 0);
                        break;
                      }
                    } else {
                      nextService = dayServices[0];
                      nextServiceDate = new Date(now);
                      nextServiceDate.setDate(now.getDate() + i);
                      const [hours, mins] = nextService.startTime.split(':').map(Number);
                      nextServiceDate.setHours(hours, mins, 0, 0);
                      break;
                    }
                  }
                }

                // Check for upcoming special events
                const nextEvent = sortedEvents.find(e => e.start > now);

                // Determine whether to show the next service or the next event
                let displayingEvent = false;
                if (nextEvent && (!nextServiceDate || nextEvent.start < nextServiceDate)) {
                  displayingEvent = true;
                  // Ignore weekly service if event comes earlier
                  nextService = null;
                }

                if (nextService) {
                  const serviceDayIndex = dayOrder.indexOf(nextService.dayOfWeek);
                  const daysUntil = (serviceDayIndex - currentDay + 7) % 7;
                  const targetDate = new Date(now);
                  targetDate.setDate(targetDate.getDate() + daysUntil);

                  const dayName = nextService.dayOfWeek.substring(0, 3).toUpperCase();
                  const dayNum = targetDate.getDate();

                  return (
                    <>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-5xl font-black text-primary dark:text-white font-display uppercase">{dayName}</span>
                        <span className="text-xl font-black text-slate-300">{dayNum}</span>
                      </div>
                      <p className="text-lg font-bold text-slate-700 dark:text-white italic border-l-4 border-secondary pl-4 mb-6">
                        {nextService.serviceName} - {nextService.dayOfWeek}
                      </p>

                      <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-lg flex items-center justify-between mb-8">
                        <div className="text-center flex-1 border-r border-slate-200 dark:border-dark">
                          <span className="block text-[9px] font-black text-slate-400 uppercase">Début</span>
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-300">{nextService.startTime}</span>
                        </div>
                        <div className="text-center flex-1">
                          <span className="block text-[9px] font-black text-slate-400 uppercase">Fin</span>
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-300">{nextService.endTime}</span>
                        </div>
                      </div>
                    </>
                  );
                } else if (nextEvent) {
                  const dayName = nextEvent.start.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').toUpperCase();
                  const dayNum = nextEvent.start.getDate();

                  return (
                    <>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-5xl font-black text-primary dark:text-white font-display uppercase">{dayName}</span>
                        <span className="text-xl font-black text-slate-300">{dayNum}</span>
                      </div>
                      <p className="text-lg font-bold text-slate-700 dark:text-white italic border-l-4 border-secondary pl-4 mb-6">{nextEvent.title}</p>

                      <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-lg flex items-center justify-between mb-8">
                        <div className="text-center flex-1 border-r border-slate-200 dark:border-dark">
                          <span className="block text-[9px] font-black text-slate-400 uppercase">Début</span>
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-300">{nextEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-center flex-1">
                          <span className="block text-[9px] font-black text-slate-400 uppercase">Fin</span>
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-300">{nextEvent.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <div className="text-center py-10 opacity-50">
                      <p className="text-sm font-bold">Aucun culte à venir</p>
                    </div>
                  );
                }
              })()}

              <Button
                onClick={() => {
                  console.log('🔘 Voir le Programme button clicked!');
                  console.log('Current viewMode:', viewMode);
                  console.log('Current activeTab:', activeTab);
                  setViewMode('calendar');
                  setActiveTab('prochains');
                  console.log('✅ Switched to calendar view and prochains tab');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  console.log('✅ Scrolled to top');
                }}
                className="w-full py-4 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-md"
              >
                Voir le Programme
              </Button>
            </div>
          </div>

          {/* Stats / Quick Info */}
          <div className="bg-indigo-900 p-6 rounded-lg shadow-admin text-white relative overflow-hidden">
            <SparklesIcon className="absolute -top-4 -right-4 w-32 h-32 text-white/5" />
            <h3 className="text-[10px] font-black uppercase text-indigo-200 tracking-[0.3em] mb-6 relative z-10">Métriques du Mois</h3>

            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-sm font-bold opacity-80">Événements Prévus</span>
                <span className="text-2xl font-black">{filteredEvents.length}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-sm font-bold opacity-80">Conflits Potentiels</span>
                <span className="text-2xl font-black text-rose-400">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals placed at end of return */}
      {/* Event Creation Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50  p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-admin w-full max-w-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-primary uppercase tracking-tight">Nouvel Événement</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Titre</label>
                <input autoFocus type="text" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all" placeholder="Titre de l'événement" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Type</label>
                  <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all">
                    <option value="Culte">Culte</option>
                    <option value="Programme Spécial">Programme Spécial</option>
                    <option value="Réunion">Réunion</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Lieu</label>
                  <input type="text" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Début</label>
                  <input type="datetime-local" value={newEvent.start ? newEvent.start.toISOString().slice(0, 16) : ''} onChange={e => setNewEvent({ ...newEvent, start: new Date(e.target.value) })} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Fin</label>
                  <input type="datetime-local" value={newEvent.end ? newEvent.end.toISOString().slice(0, 16) : ''} onChange={e => setNewEvent({ ...newEvent, end: new Date(e.target.value) })} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea rows={3} value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none" placeholder="Détails de l'événement..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-6 py-3 rounded-lg font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-white/[0.02] transition-colors">Annuler</button>
                <button type="submit" className="px-8 py-3 rounded-lg bg-primary text-white font-black uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-md">Créer Événement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50  p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-admin w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-primary uppercase tracking-tight">Saisir Effectifs</h3>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitAttendance} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Date</label>
                  <input type="date" value={attendanceForm.date} onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all" required />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Session</label>
                  <select value={attendanceForm.sessionName} onChange={e => setAttendanceForm({ ...attendanceForm, sessionName: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-dark font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all">
                    <option value="1er Culte">1er Culte</option>
                    <option value="2ème Culte">2ème Culte</option>
                    <option value="3ème Culte">3ème Culte</option>
                    <option value="Culte Mercredi">Culte Mercredi</option>
                    <option value="Culte Vendredi">Culte Vendredi</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.02] p-6 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-white">Hommes</label>
                  <input type="number" min="0" value={attendanceForm.menCount} onChange={e => setAttendanceForm({ ...attendanceForm, menCount: parseInt(e.target.value) || 0 })} className="w-24 px-4 py-2 rounded-lg border border-slate-200 dark:border-dark font-black text-center outline-none focus:border-primary text-primary dark:text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-white">Femmes</label>
                  <input type="number" min="0" value={attendanceForm.womenCount} onChange={e => setAttendanceForm({ ...attendanceForm, womenCount: parseInt(e.target.value) || 0 })} className="w-24 px-4 py-2 rounded-lg border border-slate-200 dark:border-dark font-black text-center outline-none focus:border-primary text-primary dark:text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-white">Enfants</label>
                  <input type="number" min="0" value={attendanceForm.childrenCount} onChange={e => setAttendanceForm({ ...attendanceForm, childrenCount: parseInt(e.target.value) || 0 })} className="w-24 px-4 py-2 rounded-lg border border-slate-200 dark:border-dark font-black text-center outline-none focus:border-primary text-primary dark:text-white" />
                </div>
                <div className="border-t border-slate-200 dark:border-dark pt-4 flex items-center justify-between">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400">Total</label>
                  <span className="text-2xl font-black text-primary dark:text-white">{(Number(attendanceForm.menCount) + Number(attendanceForm.womenCount) + Number(attendanceForm.childrenCount))}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAttendanceModalOpen(false)} className="px-6 py-3 rounded-lg font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-white/[0.02] transition-colors">Annuler</button>
                <button type="submit" className="px-8 py-3 rounded-lg bg-primary text-white font-black uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmState} onCancel={cancelConfirm} />
    </PageTransition>
  );
};

export default EventsPage;
