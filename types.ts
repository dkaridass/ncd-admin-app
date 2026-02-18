
export type PersonStatus = 'Fidèle' | 'Visiteur' | 'Archivé';
export type Gender = 'Homme' | 'Femme';
export type FollowUpStatus = 'Nouveau' | 'Contacté' | 'Intégré' | 'Archivé';
export type ChurchRole = 'Pasteur' | 'Pasteure' | 'Berger' | 'Bergère' | 'Frère' | 'Sœur' | 'Vice-président' | 'Admin' | 'Admin adjoint' | 'Secrétaire' | 'Serviteur' | 'Fidèle';

export type ChurchFunction =
  | 'Pasteur principal'
  | 'Pasteur résident'
  | 'Pasteur résident adjoint'
  | 'Pasteur'
  | 'Berger'
  | 'Administrateur principal'
  | 'Administrateur adjoint'
  | 'Administrateur'
  | 'Président de département'
  | 'Vice président de département'
  | 'Serviteur'
  | 'Aucune';

export type AppRole = 'SUPER_ADMIN' | 'PASTOR' | 'STAFF_ADMIN' | 'SECRETARY' | 'FINANCE_ADMIN' | 'DEPT_LEADER' | 'VOLUNTEER' | 'MEMBER' | 'VIEWER';

export type Permission =
  | 'VIEW_MEMBERS' | 'EDIT_MEMBERS' | 'DELETE_MEMBERS'
  | 'VIEW_FINANCES' | 'CREATE_FINANCES' | 'EDIT_FINANCES' | 'DELETE_FINANCES'
  | 'VIEW_PASTORAL_CARE' | 'VIEW_PRIVATE_PRAYERS'
  | 'MANAGE_DEPARTMENTS' | 'VIEW_DEPARTMENTS' | 'MANAGE_SETTINGS' | 'ACCESS_AI_CONFIG'
  | 'MANAGE_TASKS' | 'MANAGE_ANNOUNCEMENTS' | 'MANAGE_RESOURCES'
  | 'MANAGE_ROLES'
  | 'MANAGE_EVENTS'
  | 'MANAGE_DEPARTMENT_REPORTS'
  | 'SEND_MESSAGES' | 'MANAGE_TEMPLATES';

export interface User {
  id: string;
  name: string;
  role: AppRole;
  departmentId?: string;
  avatarUrl?: string;
  email?: string;
  createdAt?: string;        // ISO date string
  updatedAt?: string;        // ISO date string
  isActive?: boolean;        // Whether user account is active (default: true)
  lastLoginAt?: string;      // ISO date string - last login timestamp
}

export interface Member {
  id: string;
  name: string;
  status: PersonStatus;
  gender: Gender;
  birthDate: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address?: string;
  commune?: string;
  reference?: string;
  civilState?: string;
  availableDate?: string;
  isDePassage?: boolean;
  isSansEglise?: boolean;
  isBaptised?: boolean;
  joinDate: string;
  role: ChurchRole;
  churchFunction?: ChurchFunction;
  ministry?: string;
  family: string;
  avatarUrl: string;
  followUpStatus?: FollowUpStatus;

  // Department Assignment
  departmentIds?: string[];      // Can belong to multiple departments
  primaryDepartmentId?: string;  // Main department assignment

  // Leadership & Responsibilities
  responsibilities?: string[];   // List of roles: ["VP ECODIM", "ACCUEIL"]
  isLeader?: boolean;           // Has leadership role
  leadershipLevel?: 'Pasteur' | 'VP' | '2ème VP' | 'Président';  // Leadership type

  // Volunteer Information
  isVolunteer?: boolean;        // Is this member a volunteer
  volunteerRoles?: string[];     // Volunteer roles: ["Accueil", "Sécurité", "Son", "Multimédia"]
  volunteerDepartmentId?: string; // Primary department where they volunteer
  volunteerStatus?: 'Actif' | 'Inactif' | 'En pause'; // Volunteer status
  volunteerStartDate?: string;   // When they started volunteering (ISO date)
}

export interface Department {
  id: string;
  number: number; // Numéro officiel (1-29)
  name: string;
  category: 'Spiritualité' | 'Culte' | 'Social' | 'Opérations' | 'Famille' | 'Formation' | 'Administration' | 'Technique' | 'Logistique' | 'Jeunesse';

  // Hiérarchie Leadership (Legacy - kept for backwards compatibility)
  leaderName?: string; // Titulaire (Legacy)
  leaderTitle?: string; // Pasteur, Berger... (Legacy)
  vpName?: string; // Vice-Président (Legacy)
  vpTitle?: string; // (Legacy)
  secondVpName?: string; // 2ème Vice-Président (Legacy)
  secondVpTitle?: string; // (Legacy)

  // NEW: Leader References (Member IDs)
  leaderId?: string;       // ID of leader/berger
  vpId?: string;           // ID of Vice-Président
  secondVpId?: string;     // ID of 2ème Vice-Président

  // Members
  memberIds?: string[];    // All members in this department
  memberCount: number;

  meetingDay?: string; // Legacy: kept for backwards compatibility
  meetingDays?: string[]; // New: Supports multiple meeting days
  meetingTime?: string;
  description?: string;
  reportStatus?: 'À jour' | 'En retard';

  // New: Leaders Array
  leaders?: DepartmentLeader[];
}

export interface DepartmentLeader {
  name: string;
  role: string;       // e.g. "Pasteur", "VP", "2ème VP"
  title?: string;     // e.g. "Pasteur", "Berger", "Frère", "Sœur"
  memberId?: string;  // Link to Member collection if available
}


export interface DepartmentReport {
  id: string;
  departmentId: string;
  month: string;
  year: number;
  submittedAt: string;
  content: string;
  status: 'Approuvé' | 'En attente' | 'Révisé' | 'Archivé';
  fileName?: string;
  fileUrl?: string;
  storagePath?: string;
  submittedByUserId?: string;
  submittedByName?: string;
  feedback?: string;
}

export type FinanceAccount = 'Rawbank' | 'Equity' | 'PayPal' | 'Mpesa' | 'OrangeMoney' | 'MoneyGram' | 'Cash';

export interface FinanceRecord {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  account: FinanceAccount;
  date: string;
  memberName?: string;
  notes?: string;
  serviceName?: string;
  recordedBy: string;
  receiptUrl?: string;
  isApproved?: boolean;
}

export type TransactionType = 'Dîme' | 'Offrande' | 'Action de grâce' | 'Offrande du prophète' | 'Dons' | 'Dépense' | 'Autre';
export type ServiceSession = '1er Culte' | '2ème Culte' | '3ème Culte' | 'Culte Mercredi' | 'Culte Vendredi' | 'Séminaire' | 'Autre'; export type Currency = 'CDF' | 'USD';

// App Settings Types
export interface AppSettingsGeneral {
  churchName: string;
  slogan?: string;
  address?: string;
  city: string;
  country?: string;
  phone?: string;
  email: string;
  logoUrl?: string; // Firebase Storage path or URL
  pastorName?: string;
  serviceTimes?: string; // Free text description
}

export interface FinanceAccountConfig {
  id: string;
  name: string; // Internal ID (e.g., "Rawbank")
  displayName: string; // Display name (e.g., "Rawbank" or "Equity BCDC")
  currency: Currency;
  isActive: boolean;
  color?: string; // Tailwind color class or hex
  icon?: string; // Emoji or icon identifier
  order?: number; // For sorting
}

export interface AppSettingsFinance {
  accounts: FinanceAccountConfig[];
  defaultCurrency: Currency;
  defaultAccount: string; // Account ID
}

export interface RoleFunctionConfig {
  id: string;
  label: string;
  isActive: boolean;
  order?: number;
}

export interface AppSettingsRolesAndFunctions {
  churchRoles: RoleFunctionConfig[];
  churchFunctions: RoleFunctionConfig[];
}

export interface WeeklyServiceDefault {
  dayOfWeek: 'Dimanche' | 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  serviceName: string;
  startTime: string; // e.g., "07:20"
  endTime: string; // e.g., "09:20"
  location: string;
  description?: string;
  order: number;
}

export interface AppSettingsProgramme {
  defaultWeeklyServices: WeeklyServiceDefault[];
  defaultLocation: string;
}

export interface AppSettingsAI {
  tone: 'Pastoral' | 'Formel' | 'Analytique';
  formality: 'Soutenu' | 'Courant' | 'Simple';
  systemPrompt: string;
  apiKey?: string; // Should be encrypted/stored securely
}

export interface AppSettings {
  general: AppSettingsGeneral;
  finance: AppSettingsFinance;
  rolesAndFunctions: AppSettingsRolesAndFunctions;
  programme: AppSettingsProgramme;
  ai: AppSettingsAI;
}

// Legacy: Keep FinanceAccount type for backward compatibility
// But it should be generated from settings.finance.accounts
// export type FinanceAccount = 'Rawbank' | 'Equity' | 'PayPal' | 'Mpesa' | 'OrangeMoney' | 'MoneyGram' | 'Cash';

export interface AttendanceRecord {
  id: string;
  date: string;
  sessionName: string;
  menCount: number;
  womenCount: number;
  childrenCount: number;
  youthCount?: number; // New: Jeunes
  visitorCount?: number; // New: Visiteurs
  totalCount: number;
  notes?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location: string;
  organizer: string;
  rsvps?: string[]; // IDs of members
  type?: string; // e.g., 'Culte', 'Événement', 'Convention', etc.
  date?: string; // Legacy field for date string
}

// Weekly Service Template (recurring weekly services)
export interface WeeklyService {
  id: string;
  dayOfWeek: 'Dimanche' | 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  serviceName: string; // e.g., "1er culte", "Culte de semaine"
  startTime: string; // e.g., "07:20" or "16:30"
  endTime: string; // e.g., "09:20" or "18:30"
  location: string; // Default: "Paroisse La Pentecôte C.E. Nouvelle Cité de David"
  description?: string;
  order?: number; // For sorting multiple services on the same day (e.g., Sunday has 3 services)
  isActive: boolean; // Can disable a service without deleting
}

// Annual Programme Event (major annual events)
export interface AnnualEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  location?: string;
  category?: 'séminaire' | 'convention' | 'célébration' | 'mois' | 'gala' | 'prière' | 'école' | 'autre';
  year: number; // e.g., 2026
  organizer?: string;
  isActive: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string; // Short text or rich text
  date?: string; // Display date
  author?: string; // Display author
  category: 'Général' | 'Jeûne & Prière' | 'Finances' | 'Jeunesse' | 'Formation' | 'Événement' | 'Autre';
  target: 'Toute l\'Assemblée' | 'Départements' | 'Jeunes' | 'Femmes' | 'Hommes' | 'Leaders' | 'Bénévoles';
  startDate: string; // ISO date string - when announcement becomes visible
  endDate?: string; // ISO date string - when announcement expires (optional)
  createdAt: string; // ISO date string
  createdBy: string; // User ID
  createdByName?: string; // User name for display
  isActive: boolean; // Whether announcement is currently active
  isArchived?: boolean; // Whether announcement is archived
  readCount?: number;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'PDF' | 'Audio' | 'Vidéo' | 'Image' | 'Lien' | 'Template' | 'Document' | 'Autre';
  category: 'Formations' | 'Admin' | 'Finances' | 'Jeunesse' | 'ECODIM' | 'Prédications' | 'Médias' | 'Autre';
  fileUrl?: string; // URL to file (if external)
  storagePath?: string; // Firebase Storage path (if uploaded)
  createdAt: string; // ISO date string
  createdBy: string; // User ID
  createdByName?: string; // User name for display
  downloadCount?: number; // Track downloads
  isActive: boolean; // Whether resource is visible
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'À faire' | 'En cours' | 'Terminé';
}

export interface PrayerRequest {
  id: string;
  title?: string;              // Optional title/subject
  content: string;             // Main prayer request content (renamed from 'request')
  submittedBy: string;         // Display name of requester
  authorId?: string;           // Firebase Auth UID (if logged in)
  memberId?: string;           // Member ID if linked to a member record
  isPrivate: boolean;           // Private (only visible to requester + authorized roles) vs Public
  status: 'En attente' | 'En cours' | 'Exaucée' | 'Archivée'; // Request status
  category?: 'Santé' | 'Famille' | 'Finances' | 'Travail' | 'Spiritualité' | 'Autre'; // Optional category
  createdAt: string;           // ISO date string when created
  updatedAt: string;           // ISO date string when last updated
  prayedBy?: string[];         // Array of user IDs who have prayed for this
  notes?: string;              // Internal notes (only visible to authorized roles)
  generatedPrayer?: string;    // AI-generated prayer text (optional, generated via Groq)
}

export interface DepartmentChatMessage {
  id: string;
  departmentId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

// Communication System Types
export type MessageType = 'SMS' | 'EMAIL' | 'BOTH';
export type MessageStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
export type TemplateCategory = 'WELCOME' | 'EVENT' | 'PRAYER' | 'ANNOUNCEMENT' | 'OTHER';

export interface CommunicationMessage {
  id: string;
  subject?: string;
  content: string;
  type: MessageType;
  recipients: string[];
  recipientCount: number;
  sentBy: string;
  sentByName: string;
  sentAt: string;
  scheduledFor?: string;
  status: MessageStatus;
  deliveryStatus?: {
    sent: number;
    delivered: number;
    failed: number;
    opened?: number;
  };
  cost?: number;
  templateId?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject?: string;
  content: string;
  type: MessageType;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export interface DailyRhema {
  id: string;
  date: string; // ISO Date YYYY-MM-DD
  content: string; // The verse text
  reference: string; // e.g. "Jérémie 29:11"
  theme?: string; // Optional theme title
  author?: string; // Who added it
}

