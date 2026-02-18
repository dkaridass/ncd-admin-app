
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Member, Event, FinanceRecord, AttendanceRecord, Department, Announcement, Resource, Task, PrayerRequest, User, AppRole, Permission, DepartmentReport, DepartmentChatMessage, DailyRhema, WeeklyService, AnnualEvent } from '../types';
import { api } from '../services/api'; // Assuming you keep api wrapper or import services directly
import { membersService } from '../services/membersService';
import { financeService } from '../services/financeService';
import { rhemaService } from '../services/rhemaService';
import { departmentsService } from '../services/departmentsService';
import { authService } from '../services/authService';
import { eventsService } from '../services/eventsService';
import { attendanceService } from '../services/attendanceService';
import { reportsService } from '../services/reportsService';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  SUPER_ADMIN: [
    'VIEW_MEMBERS', 'EDIT_MEMBERS', 'DELETE_MEMBERS',
    'VIEW_FINANCES', 'CREATE_FINANCES', 'EDIT_FINANCES', 'DELETE_FINANCES',
    'VIEW_PASTORAL_CARE', 'VIEW_PRIVATE_PRAYERS',
    'MANAGE_DEPARTMENTS', 'VIEW_DEPARTMENTS', 'MANAGE_SETTINGS', 'ACCESS_AI_CONFIG',
    'MANAGE_TASKS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_RESOURCES', 'MANAGE_ROLES',
    'MANAGE_EVENTS', 'MANAGE_DEPARTMENT_REPORTS',
    'SEND_MESSAGES', 'MANAGE_TEMPLATES'
  ],
  PASTOR: [
    'VIEW_MEMBERS', 'VIEW_FINANCES', 'VIEW_PASTORAL_CARE', 'VIEW_PRIVATE_PRAYERS',
    'MANAGE_DEPARTMENTS', 'VIEW_DEPARTMENTS', 'MANAGE_ANNOUNCEMENTS',
    'MANAGE_EVENTS', 'MANAGE_DEPARTMENT_REPORTS',
    'SEND_MESSAGES', 'MANAGE_TEMPLATES'
  ],
  FINANCE_ADMIN: ['VIEW_FINANCES', 'CREATE_FINANCES', 'EDIT_FINANCES'],
  STAFF_ADMIN: [
    'VIEW_MEMBERS', 'EDIT_MEMBERS',
    'VIEW_FINANCES', 'CREATE_FINANCES',
    'VIEW_PASTORAL_CARE',
    'MANAGE_DEPARTMENTS', 'VIEW_DEPARTMENTS',
    'MANAGE_TASKS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_RESOURCES',
    'MANAGE_EVENTS', 'MANAGE_DEPARTMENT_REPORTS',
    'SEND_MESSAGES'
  ],
  // Secretariat admin: can fully manage members and basic communications, but not finances
  SECRETARY: [
    'VIEW_MEMBERS', 'EDIT_MEMBERS',
    'VIEW_PASTORAL_CARE',
    'VIEW_DEPARTMENTS',
    'SEND_MESSAGES', 'MANAGE_ANNOUNCEMENTS'
  ],
  DEPT_LEADER: ['VIEW_PASTORAL_CARE', 'MANAGE_TASKS', 'VIEW_DEPARTMENTS'],
  VOLUNTEER: ['VIEW_PASTORAL_CARE'],
  MEMBER: ['VIEW_PASTORAL_CARE'],
  VIEWER: []
};

export type Language = 'fr' | 'ln' | 'sw';

interface DataContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  language: Language;
  setLanguage: (l: Language) => void;
  loginAsRole: (role: AppRole) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  members: Member[];
  departments: Department[];
  departmentReports: DepartmentReport[];
  chatMessages: DepartmentChatMessage[];
  events: Event[];
  attendance: AttendanceRecord[];
  financeRecords: FinanceRecord[];
  financeError: string | null;
  financeSnapshotReceived: boolean;
  announcements: Announcement[];
  resources: Resource[];
  tasks: Task[];
  prayerRequests: PrayerRequest[];
  users: User[]; // All registered users for admin management
  dailyRhema: DailyRhema | null;
  weeklyServices: WeeklyService[];
  annualProgramme: AnnualEvent[];
  isLoading: boolean;
  error: string | null;
  addMember: (member: Member) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addAttendance: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  addFinanceRecord: (record: FinanceRecord) => Promise<void>;
  approveFinanceRecord: (id: string) => Promise<void>;
  deleteFinanceRecord: (id: string) => Promise<void>;
  addAnnouncement: (announcement: Announcement) => Promise<void>;
  addResource: (resource: Resource) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  addPrayerRequest: (request: PrayerRequest) => Promise<void>;
  addEvent: (event: Event) => Promise<void>;
  toggleRsvp: (eventId: string, memberId: string) => Promise<void>;
  addDepartment: (dept: Department) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addDepartmentReport: (report: DepartmentReport) => Promise<void>;
  updateReportStatus: (id: string, status: DepartmentReport['status'], feedback?: string) => Promise<void>;
  deleteDepartmentReport: (id: string, storagePath?: string) => Promise<void>;
  addChatMessage: (msg: DepartmentChatMessage) => Promise<void>;
  updateTask: (id: string, status: Task['status']) => Promise<void>;
  updateUserRole: (userId: string, newRole: AppRole) => Promise<void>; // Admin function to change user roles
  exportData: () => string;
  importData: (json: string) => boolean;
  resetDatabase: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('ncd_lang') as Language) || 'fr';
  });

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Data State
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentReports, setDepartmentReports] = useState<DepartmentReport[]>([]);
  const [chatMessages, setChatMessages] = useState<DepartmentChatMessage[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [financeSnapshotReceived, setFinanceSnapshotReceived] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]); // All users for admin management
  const [dailyRhema, setDailyRhema] = useState<DailyRhema | null>(null);
  const [weeklyServices, setWeeklyServices] = useState<WeeklyService[]>([]);
  const [annualProgramme, setAnnualProgramme] = useState<AnnualEvent[]>([]);

  // Monitor Auth State - Single Source of Truth with Real-Time Profile Updates
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthLoading(true);

      // Clean up previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // ✅ FIX: Set up real-time listener for user profile (eliminates race conditions)
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = { id: firebaseUser.uid, ...docSnap.data() } as User;
            setCurrentUser(profile);
            console.log('👤 User profile updated:', {
              email: profile.email,
              role: profile.role,
              timestamp: new Date().toISOString()
            });
          } else {
            console.warn('⚠️ User authenticated but no Firestore profile found');
            setCurrentUser(null);
          }
          setIsAuthLoading(false);
        }, (error) => {
          console.error('❌ Error listening to user profile:', error);
          setCurrentUser(null);
          setIsAuthLoading(false);
        });
      } else {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  // Persist Language
  useEffect(() => {
    localStorage.setItem('ncd_lang', language);
  }, [language]);

  // Finances - Real-time Listener (Fix for Sync Issues)
  useEffect(() => {
    if (!currentUser) {
      setFinanceSnapshotReceived(false);
      setFinanceError(null);
      return;
    }

    const q = collection(db, 'finances');
    setFinanceSnapshotReceived(false);
    setFinanceError(null);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          account: data.account || 'Cash' // Backward compatibility
        } as FinanceRecord;
      });
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFinanceRecords(records);
      setFinanceSnapshotReceived(true);
      setFinanceError(null);
    }, (err) => {
      console.error("Finance listener error:", err);
      setFinanceError(err?.message ?? 'Erreur de chargement des soldes.');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Members - Real-time Listener (Fix for Sync Issues)
  useEffect(() => {
    if (!currentUser) return;

    const q = collection(db, 'members');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const membersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Member));
        // Sort by name in memory
        membersList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setMembers(membersList);
        console.log(`✅ Members updated: ${membersList.length} members`);
      },
      (err) => {
        console.error("Members listener error:", err);
        // Don't clear members on error to avoid flashing empty state
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Departments - Real-time Listener (Fix for Sync Issues)
  useEffect(() => {
    if (!currentUser) return;

    const q = collection(db, 'departments');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const deptsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Department));
        // Sort by name in memory
        deptsList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setDepartments(deptsList);
        console.log(`✅ Departments updated: ${deptsList.length} departments`);
      },
      (err) => {
        console.error("Departments listener error:", err);
        // Don't clear departments on error to avoid flashing empty state
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Events - Real-time Listener
  useEffect(() => {
    if (!currentUser) return;

    const q = collection(db, 'events');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            start: data.start?.toDate ? data.start.toDate() : new Date(data.start),
            end: data.end?.toDate ? data.end.toDate() : new Date(data.end)
          } as Event;
        });
        setEvents(eventsList);
      },
      (err) => {
        console.error("Events listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Attendance - Real-time Listener
  useEffect(() => {
    if (!currentUser) return;

    const q = collection(db, 'attendance');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const attendanceList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AttendanceRecord));
        // Sort by date desc
        attendanceList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAttendance(attendanceList);
      },
      (err) => {
        console.error("Attendance listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Load Rhema (one-time fetch, then auto-generate if needed)
  useEffect(() => {
    if (!currentUser) return;

    const loadRhema = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        let rhemaToShow = await rhemaService.getForDate(todayStr);

        // Auto-generate Rhema if missing for today
        if (!rhemaToShow || rhemaToShow.date !== todayStr) {
          console.log("📖 Context: No Rhema found for today, triggering AI generation...");
          rhemaToShow = await rhemaService.generateDailyRhema(todayStr);
        }

        setDailyRhema(rhemaToShow);
      } catch (err) {
        console.error("Error loading Rhema:", err);
      }
    };
    loadRhema();
  }, [currentUser]);

  // Weekly Services - Real-time Listener
  useEffect(() => {
    if (!currentUser) {
      setWeeklyServices([]);
      return;
    }

    const q = collection(db, 'weeklyServices');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const services = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as WeeklyService));

        // Sort in memory by dayOfWeek and order
        const dayOrder = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        services.sort((a, b) => {
          const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
          if (dayDiff !== 0) return dayDiff;
          return (a.order || 0) - (b.order || 0);
        });

        setWeeklyServices(services);
        console.log(`✅ Weekly services updated: ${services.length} services`);
      },
      (err) => {
        console.error("Weekly services listener error:", err);
        setWeeklyServices([]);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Annual Programme - Real-time Listener
  useEffect(() => {
    if (!currentUser) {
      setAnnualProgramme([]);
      return;
    }

    const q = collection(db, 'annualProgramme');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AnnualEvent));

        // Sort by startDate
        events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        setAnnualProgramme(events);
        console.log(`✅ Annual programme updated: ${events.length} events`);
      },
      (err) => {
        console.error("Annual programme listener error:", err);
        setAnnualProgramme([]);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Define hasPermission early so it can be used in useEffect hooks
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!currentUser) return false;
    return ROLE_PERMISSIONS[currentUser.role]?.includes(permission) || false;
  }, [currentUser]);

  // Fetch all users (for admin user management) - Real-time updates
  useEffect(() => {
    if (!currentUser || !hasPermission('MANAGE_ROLES')) return; // Only load for admins

    try {
      const usersRef = collection(db, 'users');
      const unsubscribe = onSnapshot(usersRef, (snapshot) => {
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      }, (error) => {
        console.error('Error fetching users:', error);
        setUsers([]);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up users listener:', error);
      setUsers([]);
    }
  }, [currentUser, hasPermission]);

  // Actions
  const loginAsRole = async (role: AppRole) => {
    // Dev helper - in real Firebase, this would be re-auth with different credentials
    // For now, let's keep it as is, but it WON'T WORK with real Auth properly unless we mock it or use Emulator.
    // We should deprecate this or map it to test accounts.
    alert("En mode Firebase, veuillez utiliser la page de Connexion avec les identifiants réels.");
  };

  const logout = async () => {
    await authService.logout();
  };

  // --- Real Service Integrations ---

  // Members (Real-time listener handles state updates)
  const addMember = async (m: Member) => {
    try {
      await membersService.add(m);
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur ajout membre");
      throw e;
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    try {
      await membersService.update(id, updates);
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur maj membre");
      throw e;
    }
  };

  const deleteMember = async (id: string) => {
    console.log("DataContext: deleteMember called for id:", id);
    try {
      await membersService.delete(id);
      // Listener will update state automatically
      console.log("DataContext: Delete successful, listener will update UI");
    } catch (e) {
      console.error("DataContext: deleteMember error", e);
      setError("Erreur suppression membre");
      throw e; // Re-throw to let UI handle it
    }
  };

  // Finances Actions (Modified to rely on Listener)
  const addFinanceRecord = async (r: FinanceRecord) => {
    try {
      await financeService.add(r);
      // setFinanceRecords(prev => [newRecord, ...prev]); // REMOVED: Listener updates state
    } catch (e) { setError("Erreur finance"); throw e; }
  };

  const approveFinanceRecord = async (id: string) => {
    try {
      await financeService.approve(id);
      // setFinanceRecords(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r)); // REMOVED: Listener updates state
    } catch (e) { setError("Erreur approbation"); throw e; }
  };

  const deleteFinanceRecord = async (id: string) => {
    try {
      await financeService.delete(id);
    } catch (e) { setError("Erreur suppression finance"); throw e; }
  };

  // Departments (Real-time listener handles state updates)
  const addDepartment = async (d: Department) => {
    try {
      await departmentsService.add(d);
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur département");
      throw e;
    }
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      await departmentsService.update(id, updates);
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur maj département");
      throw e;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      await departmentsService.delete(id);
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur suppression département");
      throw e;
    }
  };


  // --- Integrated Services ---

  // Attendance (Real-time listener handles state updates)
  const addAttendance = async (r: Omit<AttendanceRecord, 'id'>) => {
    try {
      await attendanceService.add(r as AttendanceRecord); // Cast as ID is handled by service/firebase
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur ajout présence");
      throw e;
    }
  };

  // Events (Real-time listener handles state updates)
  const addEvent = async (e: Event) => {
    try {
      await eventsService.add(e);
      // Listener will update state automatically
    } catch (err) {
      setError("Erreur ajout événement");
      throw err;
    }
  };

  const toggleRsvp = async (eventId: string, memberId: string) => {
    try {
      const event = events.find(e => e.id === eventId);
      await eventsService.toggleRsvp(eventId, memberId, event?.rsvps);

      setEvents(prev => prev.map(e => {
        if (e.id === eventId) {
          const rsvps = e.rsvps || [];
          const newRsvps = rsvps.includes(memberId)
            ? rsvps.filter(id => id !== memberId)
            : [...rsvps, memberId];
          return { ...e, rsvps: newRsvps };
        }
        return e;
      }));
    } catch (err) { setError("Erreur RSVP"); }
  };

  // --- Reports Listener ---
  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, 'departmentReports');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepartmentReport));
      // Sort by date desc
      reps.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setDepartmentReports(reps);
    }, (err) => console.error("Reports listener error", err));
    return () => unsubscribe();
  }, [currentUser]);


  // ...

  const addDepartmentReport = async (r: DepartmentReport) => {
    try {
      await reportsService.add(r);
    } catch (e) { setError("Erreur ajout rapport"); throw e; }
  };

  const updateReportStatus = async (id: string, status: DepartmentReport['status'], feedback?: string) => {
    try {
      await reportsService.update(id, { status, feedback });
    } catch (e) { setError("Erreur maj rapport"); throw e; }
  };

  const deleteDepartmentReport = async (id: string, storagePath?: string) => {
    try {
      await reportsService.delete(id, storagePath);
      // Optimistic update
      setDepartmentReports(prev => prev.filter(r => r.id !== id));
    } catch (e) { setError("Erreur suppression rapport"); throw e; }
  };

  // ... (Other missing functions implementation if needed, but sticking to Reports for now)
  const addAnnouncement = async (a: Announcement) => { };
  const addResource = async (r: Resource) => { };
  const addTask = async (t: Task) => { };
  const updateTask = async (id: string, s: Task['status']) => { };
  const addPrayerRequest = async (r: PrayerRequest) => { };
  const addChatMessage = async (m: DepartmentChatMessage) => { };

  // Update User Role (Admin only)
  const updateUserRole = async (userId: string, newRole: AppRole) => {
    if (!currentUser || !hasPermission('MANAGE_ROLES')) {
      throw new Error('Permission denied: Only SUPER_ADMIN can change user roles');
    }

    // Prevent admin from removing their own SUPER_ADMIN role
    if (userId === currentUser.id && currentUser.role === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
      throw new Error('You cannot remove your own SUPER_ADMIN role');
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  const resetDatabase = () => { };
  const importData = (json: string) => false;
  const exportData = () => "";

  return (
    <DataContext.Provider value={{
      currentUser, isAuthLoading, language, setLanguage, loginAsRole, logout, hasPermission,
      members: members || [],
      departments: departments || [],
      departmentReports: departmentReports || [],
      chatMessages: chatMessages || [],
      events: events || [],
      attendance: attendance || [],
      financeRecords: financeRecords || [],
      financeError,
      financeSnapshotReceived,
      announcements: announcements || [],
      resources: resources || [],
      tasks: tasks || [],
      prayerRequests: prayerRequests || [],
      users: users || [],
      dailyRhema,
      weeklyServices: weeklyServices || [],
      annualProgramme: annualProgramme || [],
      isLoading, error,
      addMember, updateMember, deleteMember, addAttendance, addFinanceRecord, approveFinanceRecord, deleteFinanceRecord, addAnnouncement, addResource, addTask, addPrayerRequest, addEvent, toggleRsvp,
      addDepartment, updateDepartment, deleteDepartment, addDepartmentReport, updateReportStatus, deleteDepartmentReport, addChatMessage, updateTask, updateUserRole,
      exportData, importData, resetDatabase
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData context error');
  return context;
};
