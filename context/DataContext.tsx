
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Member, Event, FinanceRecord, AttendanceRecord, Department, Announcement, Resource, Task, PrayerRequest, User, AppRole, Permission, DepartmentReport, DepartmentChatMessage, DailyRhema, WeeklyService, AnnualEvent, MessageTemplate, CommunicationMessage, FollowUp, SermonPlan, PastoralBriefing } from '../types';
import { api } from '../services/api';
import { membersService } from '../services/membersService';
import { financeService } from '../services/financeService';
import { rhemaService } from '../services/rhemaService';
import { departmentsService } from '../services/departmentsService';
import { authService } from '../services/authService';
import { eventsService } from '../services/eventsService';
import { attendanceService } from '../services/attendanceService';
import { reportsService } from '../services/reportsService';
import { prayerRequestsService } from '../services/prayerRequestsService';
import { resourcesService } from '../services/resourcesService';
import { followUpService } from '../services/followUpService';
import { sermonsService } from '../services/sermonsService';
import { briefingsService } from '../services/briefingsService';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, limit, orderBy, getCountFromServer } from 'firebase/firestore';
import { auditService, AuditAction } from '../services/auditService';

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
  totalFinancesCount: number;
  financeError: string | null;
  financeSnapshotReceived: boolean;
  announcements: Announcement[];
  resources: Resource[];
  tasks: Task[];
  prayerRequests: PrayerRequest[];
  followUps: FollowUp[];
  users: User[]; // All registered users for admin management
  totalMembersCount: number;
  dailyRhema: DailyRhema | null;
  weeklyServices: WeeklyService[];
  annualProgramme: AnnualEvent[];
  templates: MessageTemplate[];
  sermonPlans: SermonPlan[];
  pastoralBriefings: PastoralBriefing[];
  isLoading: boolean;
  error: string | null;
  addMember: (member: Member) => Promise<void>;
  addMembersBatch: (members: Omit<Member, 'id'>[]) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addAttendance: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  addFinanceRecord: (record: FinanceRecord) => Promise<void>;
  approveFinanceRecord: (id: string) => Promise<void>;
  rejectFinanceRecord: (id: string, reason: string) => Promise<void>;
  deleteFinanceRecord: (id: string) => Promise<void>;
  addAnnouncement: (announcement: Announcement) => Promise<void>;
  addResource: (resource: Resource) => Promise<void>;
  updateResource: (id: string, updates: Partial<Resource>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  incrementResourceDownload: (id: string) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  addPrayerRequest: (request: PrayerRequest) => Promise<void>;
  addEvent: (event: Event) => Promise<void>;
  toggleRsvp: (eventId: string, memberId: string) => Promise<void>;
  addDepartment: (dept: Department) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addDepartmentReport: (report: DepartmentReport) => Promise<void>;
  updateReportStatus: (id: string, status: DepartmentReport['status'], feedback?: string) => Promise<void>;
  updateDepartmentReport: (id: string, updates: Partial<DepartmentReport>) => Promise<void>;
  deleteDepartmentReport: (id: string, storagePath?: string) => Promise<void>;
  addChatMessage: (msg: DepartmentChatMessage) => Promise<void>;
  updateTask: (id: string, status: Task['status']) => Promise<void>;
  addFollowUp: (followUp: Omit<FollowUp, 'id'>) => Promise<void>;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => Promise<void>;
  resolveFollowUp: (id: string, notes?: string) => Promise<void>;
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;
  updateFinanceRecord: (id: string, updates: Partial<FinanceRecord>) => Promise<void>;
  updateUserRole: (userId: string, newRole: AppRole) => Promise<void>;
  updateUserDepartments: (userId: string, departmentIds: string[]) => Promise<void>;
  updateUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;

  // Sermon Plans Methods
  addSermonPlan: (sermon: Omit<SermonPlan, 'id'>) => Promise<void>;
  updateSermonPlan: (id: string, updates: Partial<SermonPlan>) => Promise<void>;
  deleteSermonPlan: (id: string) => Promise<void>;

  // Pastoral Briefing Methods
  addPastoralBriefing: (briefing: Omit<PastoralBriefing, 'id'>) => Promise<void>;
  updatePastoralBriefing: (id: string, updates: Partial<PastoralBriefing>) => Promise<void>;
  deletePastoralBriefing: (id: string) => Promise<void>;

  // Announcement / Template Methods
  deleteAnnouncement: (id: string) => Promise<void>;
  addTemplate: (template: MessageTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

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

  const logAudit = (action: AuditAction, targetType: string, targetLabel?: string, targetId?: string, details?: string) => {
    if (!currentUser) return;
    auditService.log({
      action,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      targetType,
      targetLabel,
      targetId,
      details
    });
  };

  // Data State
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentReports, setDepartmentReports] = useState<DepartmentReport[]>([]);
  const [chatMessages, setChatMessages] = useState<DepartmentChatMessage[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [totalFinancesCount, setTotalFinancesCount] = useState<number>(0);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [financeSnapshotReceived, setFinanceSnapshotReceived] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [users, setUsers] = useState<User[]>([]); // All users for admin management
  const [totalMembersCount, setTotalMembersCount] = useState<number>(0);
  const [dailyRhema, setDailyRhema] = useState<DailyRhema | null>(null);
  const [weeklyServices, setWeeklyServices] = useState<WeeklyService[]>([]);
  const [annualProgramme, setAnnualProgramme] = useState<AnnualEvent[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [sermonPlans, setSermonPlans] = useState<SermonPlan[]>([]);
  const [pastoralBriefings, setPastoralBriefings] = useState<PastoralBriefing[]>([]);

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

    const fetchFinanceCount = async () => {
      try {
        const snap = await getCountFromServer(collection(db, 'finances'));
        setTotalFinancesCount(snap.data().count);
      } catch (e) {
        console.error("Failed to fetch finance count", e);
      }
    };
    fetchFinanceCount();

    const q = query(collection(db, 'finances'), orderBy('date', 'desc'), limit(200));
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
      // Sort is redundant if query has orderBy, but kept for safety
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

    const fetchMemberCount = async () => {
      try {
        const snap = await getCountFromServer(collection(db, 'members'));
        setTotalMembersCount(snap.data().count);
      } catch (e) {
        console.error("Failed to fetch members count", e);
      }
    };
    fetchMemberCount();

    const q = query(collection(db, 'members'), orderBy('name', 'asc'), limit(200));
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
        deptsList.sort((a, b) => a.name.localeCompare(b.name));
        setDepartments(deptsList);
      },
      (err) => console.error("Departments listener error:", err)
    );

    return () => unsubscribe();
  }, [currentUser]);

  // FollowUps Listener
  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, 'followUps');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as FollowUp));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFollowUps(list);
      },
      (err) => console.error("FollowUps listener error:", err)
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

  // Templates - Real-time Listener
  useEffect(() => {
    if (!currentUser) {
      setTemplates([]);
      return;
    }

    const q = collection(db, 'messageTemplates');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tpls = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MessageTemplate));
        setTemplates(tpls);
      },
      (err) => {
        console.error("Templates listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Announcements - Real-time Listener (C3 fix)
  useEffect(() => {
    if (!currentUser) {
      setAnnouncements([]);
      return;
    }

    const q = collection(db, 'announcements');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const anns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Announcement));
        anns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAnnouncements(anns);
        console.log(`✅ Announcements updated: ${anns.length} announcements`);
      },
      (err) => {
        console.error("Announcements listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Prayer Requests - Real-time Listener (I6 fix)
  useEffect(() => {
    if (!currentUser) {
      setPrayerRequests([]);
      return;
    }

    const q = collection(db, 'prayer_requests');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reqs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
          } as PrayerRequest;
        });
        reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPrayerRequests(reqs);
        console.log(`✅ Prayer requests updated: ${reqs.length} requests`);
      },
      (err) => {
        console.error("Prayer requests listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Resources - Real-time Listener (I6 fix)
  useEffect(() => {
    if (!currentUser) {
      setResources([]);
      return;
    }

    const q = collection(db, 'resources');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const res = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Resource));
        res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setResources(res);
        console.log(`✅ Resources updated: ${res.length} resources`);
      },
      (err) => {
        console.error("Resources listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Sermon Plans - Real-time Listener
  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, 'sermon_plans');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SermonPlan));
      plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSermonPlans(plans);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Pastoral Briefings - Real-time Listener
  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, 'pastoral_briefings');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const briefings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PastoralBriefing));
      briefings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPastoralBriefings(briefings);
    });
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
      logAudit('CREATE_MEMBER', 'member', m.name, m.id);
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur ajout membre");
      throw e;
    }
  };

  const addMembersBatch = async (membersToImport: Omit<Member, 'id'>[]) => {
    try {
      await membersService.addBatch(membersToImport);
      logAudit('IMPORT_MEMBERS', 'member', `Imported ${membersToImport.length} members`);
    } catch (e) {
      setError("Erreur importation massive");
      throw e;
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    try {
      await membersService.update(id, updates);
      logAudit('UPDATE_MEMBER', 'member', updates.name || id, id);
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur maj membre");
      throw e;
    }
  };

  const deleteMember = async (id: string) => {
    console.log("DataContext: deleteMember called for id:", id);
    try {
      const member = members.find(m => m.id === id);
      await membersService.delete(id);
      logAudit('DELETE_MEMBER', 'member', member?.name || id, id);
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
      logAudit('CREATE_FINANCE', 'finance', `${r.amount} ${r.currency} - ${r.type}`);
      // setFinanceRecords(prev => [newRecord, ...prev]); // REMOVED: Listener updates state
    } catch (e) { setError("Erreur finance"); throw e; }
  };

  const approveFinanceRecord = async (id: string) => {
    try {
      const approverName = currentUser?.name || 'Admin';
      await financeService.approve(id, approverName);
      logAudit('APPROVE_FINANCE', 'finance', `Approuvé par ${approverName}`, id);
    } catch (e) { setError("Erreur approbation"); throw e; }
  };

  const rejectFinanceRecord = async (id: string, reason: string) => {
    try {
      const rejectorName = currentUser?.name || 'Admin';
      await financeService.reject(id, rejectorName, reason);
      logAudit('REJECT_FINANCE', 'finance', `Rejeté par ${rejectorName}: ${reason}`, id);
    } catch (e) { setError("Erreur rejet"); throw e; }
  };

  const deleteFinanceRecord = async (id: string) => {
    try {
      await financeService.delete(id);
      logAudit('DELETE_FINANCE', 'finance', id, id);
    } catch (e) { setError("Erreur suppression finance"); throw e; }
  };

  // Departments (Real-time listener handles state updates)
  const addDepartment = async (d: Department) => {
    try {
      await departmentsService.add(d);
      logAudit('CREATE_DEPARTMENT', 'department', d.name);
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur département");
      throw e;
    }
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      await departmentsService.update(id, updates);
      logAudit('UPDATE_DEPARTMENT', 'department', updates.name || id, id);
      // Listener will update state automatically
    } catch (e) {
      setError("Erreur maj département");
      throw e;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const dept = departments.find(d => d.id === id);
      await departmentsService.delete(id);
      logAudit('DELETE_DEPARTMENT', 'department', dept?.name || id, id);
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
      logAudit('CREATE_ATTENDANCE', 'attendance', `${r.sessionName} - ${r.date}`);
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
      logAudit('CREATE_EVENT', 'event', e.title);
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
      const dept = departments.find(d => d.id === r.departmentId);
      logAudit('SUBMIT_REPORT', 'report', `Rapport ${dept?.name || ''} - ${r.month} ${r.year}`);
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

  const updateDepartmentReport = async (id: string, updates: Partial<DepartmentReport>) => {
    try {
      await reportsService.update(id, updates);
    } catch (e) { setError("Erreur maj rapport"); throw e; }
  };

  const updateAttendance = async (id: string, updates: Partial<AttendanceRecord>) => {
    try {
      await attendanceService.update(id, updates);
    } catch (e) { setError("Erreur maj présence"); throw e; }
  };

  const deleteAttendance = async (id: string) => {
    try {
      await attendanceService.delete(id);
      logAudit('DELETE_ATTENDANCE', 'attendance', id, id);
    } catch (e) { setError("Erreur suppression présence"); throw e; }
  };

  const updateFinanceRecord = async (id: string, updates: Partial<FinanceRecord>) => {
    try {
      await financeService.update(id, updates);
    } catch (e) { setError("Erreur maj finance"); throw e; }
  };

  // Announcement Actions
  const addAnnouncement = async (a: Announcement) => {
    try {
      await addDoc(collection(db, 'announcements'), a);
      logAudit('CREATE_ANNOUNCEMENT', 'announcement', a.title);
    } catch (e) { setError("Erreur ajout annonce"); throw e; }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      logAudit('DELETE_ANNOUNCEMENT', 'announcement', id, id);
    } catch (e) { setError("Erreur suppression annonce"); throw e; }
  };

  // Template Actions
  const addTemplate = async (t: MessageTemplate) => {
    try {
      await addDoc(collection(db, 'messageTemplates'), t);
    } catch (e) { setError("Erreur ajout modèle"); throw e; }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messageTemplates', id));
    } catch (e) { setError("Erreur suppression modèle"); throw e; }
  };

  // Resource Actions (C2 fix)
  const addResource = async (r: Resource) => {
    try {
      const { id, ...data } = r;
      await addDoc(collection(db, 'resources'), data);
    } catch (e) { setError("Erreur ajout ressource"); throw e; }
  };

  // I8 fix: updateResource, deleteResource, incrementResourceDownload
  const updateResource = async (id: string, updates: Partial<Resource>) => {
    try {
      await resourcesService.update(id, updates);
    } catch (e) { setError("Erreur maj ressource"); throw e; }
  };

  const deleteResource = async (id: string) => {
    try {
      await resourcesService.delete(id);
    } catch (e) { setError("Erreur suppression ressource"); throw e; }
  };

  const incrementResourceDownload = async (id: string) => {
    try {
      await resourcesService.incrementDownloadCount(id);
    } catch (e) { console.error("Erreur increment download:", e); }
  };

  // Task Actions (C2 fix)
  const addTask = async (t: Task) => {
    try {
      const { id, ...data } = t;
      await addDoc(collection(db, 'tasks'), data);
    } catch (e) { setError("Erreur ajout tâche"); throw e; }
  };

  const updateTask = async (id: string, s: Task['status']) => {
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, { status: s });
    } catch (e) { setError("Erreur maj tâche"); throw e; }
  };

  // Prayer Request Actions (C2 fix)
  const addPrayerRequest = async (r: PrayerRequest) => {
    try {
      await prayerRequestsService.add(r);
    } catch (e) { setError("Erreur ajout prière"); throw e; }
  };

  // Chat Message Actions (C2 fix)
  const addChatMessage = async (m: DepartmentChatMessage) => {
    try {
      const { id, ...data } = m;
      await addDoc(collection(db, 'departmentChat'), data);
    } catch (e) { setError("Erreur envoi message"); throw e; }
  };

  // FollowUp Actions
  const addFollowUp = async (f: Omit<FollowUp, 'id'>) => {
    try {
      await followUpService.add(f);
    } catch (e) { setError("Erreur ajout suivi"); throw e; }
  };

  const updateFollowUp = async (id: string, updates: Partial<FollowUp>) => {
    try {
      await followUpService.update(id, updates);
    } catch (e) { setError("Erreur maj suivi"); throw e; }
  };

  const resolveFollowUp = async (id: string, notes?: string) => {
    try {
      await followUpService.resolve(id, notes);
    } catch (e) { setError("Erreur resolution suivi"); throw e; }
  };

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

  // Update User Department Assignment (Admin only)
  const updateUserDepartments = async (userId: string, departmentIds: string[]) => {
    if (!currentUser || !hasPermission('MANAGE_ROLES')) {
      throw new Error('Permission denied: Only SUPER_ADMIN can assign departments');
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        departmentIds: departmentIds,
        departmentId: departmentIds.length > 0 ? departmentIds[0] : null,
        updatedAt: new Date().toISOString()
      });
      logAudit('ASSIGN_DEPARTMENT', 'user', `Départements assignés: ${departmentIds.join(', ')}`, userId);
    } catch (error) {
      console.error('Error updating user departments:', error);
      throw error;
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    if (!currentUser || !hasPermission('MANAGE_ROLES')) {
      throw new Error('Permission denied: Only SUPER_ADMIN can manage users');
    }
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive,
        updatedAt: new Date().toISOString()
      });
      logAudit('UPDATE_USER_STATUS', 'user', `Statut ${isActive ? 'activé' : 'désactivé'}`, userId);
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser || !hasPermission('MANAGE_ROLES')) {
      throw new Error('Permission denied: Only SUPER_ADMIN can delete users');
    }
    // Cannot delete yourself
    if (userId === currentUser.id) {
      throw new Error('Vous ne pouvez pas supprimer votre propre compte');
    }
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      // We can't easily delete from Firebase Auth without a Cloud Function, but removing from Firestore blocks app access via RBAC
      logAudit('DELETE_USER', 'user', `Utilisateur supprimé`, userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    if (!currentUser || !hasPermission('MANAGE_ROLES')) {
      throw new Error('Permission denied: Only SUPER_ADMIN can edit users');
    }
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      logAudit('UPDATE_USER', 'user', 'Mise à jour profil', userId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Sermon Plans Integrations
  const addSermonPlan = async (s: Omit<SermonPlan, 'id'>) => {
    try {
      await sermonsService.add(s);
      logAudit('CREATE_SERMON', 'sermon', s.title);
    } catch (e) { setError("Erreur ajout sermon"); throw e; }
  };

  const updateSermonPlan = async (id: string, updates: Partial<SermonPlan>) => {
    try {
      await sermonsService.update(id, updates);
    } catch (e) { setError("Erreur maj sermon"); throw e; }
  };

  const deleteSermonPlan = async (id: string) => {
    try {
      await sermonsService.delete(id);
      logAudit('DELETE_SERMON', 'sermon', id, id);
    } catch (e) { setError("Erreur suppression sermon"); throw e; }
  };

  // Pastoral Briefings Integrations
  const addPastoralBriefing = async (b: Omit<PastoralBriefing, 'id'>) => {
    try {
      await briefingsService.add(b);
      logAudit('CREATE_BRIEFING', 'briefing', b.date);
    } catch (e) { setError("Erreur ajout briefing"); throw e; }
  };

  const updatePastoralBriefing = async (id: string, updates: Partial<PastoralBriefing>) => {
    try {
      await briefingsService.update(id, updates);
    } catch (e) { setError("Erreur maj briefing"); throw e; }
  };

  const deletePastoralBriefing = async (id: string) => {
    try {
      await briefingsService.delete(id);
      logAudit('DELETE_BRIEFING', 'briefing', id, id);
    } catch (e) { setError("Erreur suppression briefing"); throw e; }
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
      followUps: followUps || [],
      users: users || [],
      dailyRhema,
      weeklyServices: weeklyServices || [],
      annualProgramme: annualProgramme || [],
      sermonPlans: sermonPlans || [],
      pastoralBriefings: pastoralBriefings || [],
      active: true,
      templates: templates || [],
      isLoading, error,
      addMember, addMembersBatch, updateMember, deleteMember, addAttendance, deleteAttendance, addFinanceRecord, approveFinanceRecord, rejectFinanceRecord, deleteFinanceRecord,
      addAnnouncement, deleteAnnouncement,
      addTemplate, deleteTemplate,
      addSermonPlan, updateSermonPlan, deleteSermonPlan,
      addPastoralBriefing, updatePastoralBriefing, deletePastoralBriefing,
      addResource, updateResource, deleteResource, incrementResourceDownload, addTask, addPrayerRequest, addEvent, toggleRsvp,
      addDepartment, updateDepartment, deleteDepartment, addDepartmentReport, updateReportStatus, updateDepartmentReport, deleteDepartmentReport, addChatMessage, updateTask, updateUserRole, updateUserDepartments, updateUserStatus, deleteUser, updateUser,
      updateAttendance, updateFinanceRecord,
      addFollowUp, updateFollowUp, resolveFollowUp,
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
