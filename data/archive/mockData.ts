
import { Member, FinanceRecord, AttendanceRecord, Department, Event, Announcement, Resource, Task, PrayerRequest } from '../types';

export const mockMembers: Member[] = [
  { id: 'm-1', name: 'Dr Jean-Clément Diambilay', status: 'Fidèle', gender: 'Homme', birthDate: '1975-05-12', phone: '+243 810 000 001', email: 'pasteur.jd@ncd.cd', joinDate: '2010-01-01', role: 'Pasteur', ministry: 'Direction', family: 'Diambilay', avatarUrl: 'https://ui-avatars.com/api/?name=Jean-Clement+Diambilay&background=1E1B4B&color=fff' },
  { id: 'm-2', name: 'Samy Makengu', status: 'Fidèle', gender: 'Homme', birthDate: '1980-01-01', phone: '+243 810 000 002', email: 'samy@ncd.cd', joinDate: '2012-01-01', role: 'Pasteur', family: 'Makengu', avatarUrl: 'https://ui-avatars.com/api/?name=Samy+Makengu&background=1E1B4B&color=fff' },
  { id: 'm-3', name: 'Paul Kembe', status: 'Fidèle', gender: 'Homme', birthDate: '1985-05-20', phone: '+243 810 000 003', email: 'paul@ncd.cd', joinDate: '2014-01-01', role: 'Berger', family: 'Kembe', avatarUrl: 'https://ui-avatars.com/api/?name=Paul+Kembe&background=1E1B4B&color=fff' },
  { id: 'm-4', name: 'Dora Nanga', status: 'Fidèle', gender: 'Femme', birthDate: '1990-03-15', phone: '+243 810 000 004', email: 'dora@ncd.cd', joinDate: '2015-01-01', role: 'Sœur', family: 'Nanga', avatarUrl: 'https://ui-avatars.com/api/?name=Dora+Nanga&background=F59E0B&color=fff' },
  { id: 'm-5', name: 'Louise Mwadi', status: 'Fidèle', gender: 'Femme', birthDate: '1982-11-10', phone: '+243 810 000 005', email: 'louise@ncd.cd', joinDate: '2011-01-01', role: 'Bergère', family: 'Mwadi', avatarUrl: 'https://ui-avatars.com/api/?name=Louise+Mwadi&background=F59E0B&color=fff' },
  { id: 'm-6', name: 'Yann Bilolo', status: 'Fidèle', gender: 'Homme', birthDate: '1988-06-12', phone: '+243 810 000 008', email: 'yann@ncd.cd', joinDate: '2014-01-01', role: 'Berger', family: 'Bilolo', avatarUrl: 'https://ui-avatars.com/api/?name=Yann+Bilolo&background=1E1B4B&color=fff' },
  { id: 'm-7', name: 'Denis Ngoie', status: 'Fidèle', gender: 'Homme', birthDate: '1978-02-20', phone: '+243 810 000 010', email: 'denis@ncd.cd', joinDate: '2011-01-01', role: 'Pasteur', family: 'Ngoie', avatarUrl: 'https://ui-avatars.com/api/?name=Denis+Ngoie&background=1E1B4B&color=fff' },
];

// Liste intégrale des 29 départements basée sur les documents fournis
export const mockDepartments: Department[] = [
  { 
    id: 'dept-1', number: 1, name: "CORPS DES PRÉDICATEURS", category: 'Culte', 
    leaderName: "Samy Makengu", leaderTitle: "Pasteur", vpName: "Olivier Senga", vpTitle: "Pasteur",
    meetingDay: "Jeudi", meetingTime: "17:00", memberCount: 15, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-2', number: 2, name: "TECHNIQUE", category: 'Technique', 
    leaderName: "Grace Tshilombo", leaderTitle: "Frère", vpName: "Ephraim Kaly Nsapu", vpTitle: "Frère",
    meetingDay: "", meetingTime: "", memberCount: 12, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-3', number: 3, name: "INTERPRÉTARIAT", category: 'Opérations', 
    leaderName: "Jean-Didier Bikakala", leaderTitle: "Berger", vpName: "Guy Gwamonzi", vpTitle: "Frère",
    meetingDay: "", meetingTime: "", memberCount: 10, reportStatus: 'En retard' 
  },
  { 
    id: 'dept-4', number: 4, name: "FINANCES", category: 'Administration', 
    leaderName: "Paul Kembe", leaderTitle: "Berger", vpName: "Eulalie Shimata", vpTitle: "Sœur",
    meetingDay: "Mardi", meetingTime: "10:00", memberCount: 8, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-5', number: 5, name: "EVANGÉLISATION", category: 'Spiritualité', 
    leaderName: "Dimitri Mukuna", leaderTitle: "Berger", vpName: "Michel Ngotizo", vpTitle: "Frère",
    meetingDay: "Samedi", meetingTime: "15:00", memberCount: 25, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-6', number: 6, name: "DÉVOTION MATINALE", category: 'Spiritualité', 
    leaderName: "Denis Ngoie", leaderTitle: "Pasteur", vpName: "Bruno Tshitende", vpTitle: "Berger",
    meetingDay: "Lundi à Samedi", meetingTime: "08:30", memberCount: 40, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-7', number: 7, name: "PROTOCOLES", category: 'Opérations', 
    leaderName: "Yann Bilolo", leaderTitle: "Berger", vpName: "Scheila", vpTitle: "Sœur", secondVpName: "Huguette Bilonda", secondVpTitle: "Sœur",
    meetingDay: "Samedi", meetingTime: "13:00", memberCount: 35, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-8', number: 8, name: "JVI", category: 'Jeunesse', 
    leaderName: "Direction JVI", leaderTitle: "", vpName: "Jean-Rene Lumbu", vpTitle: "2ème VP",
    meetingDay: "Dimanche", meetingTime: "16:00", memberCount: 60, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-9', number: 9, name: "ACCUEIL", category: 'Opérations', 
    leaderName: "Papy Kongolo", leaderTitle: "Berger",
    meetingDay: "Mardi", meetingTime: "17:00", memberCount: 20, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-10', number: 10, name: "PRESSE", category: 'Opérations', 
    leaderName: "Israel Sendwe", leaderTitle: "Berger",
    meetingDay: "", meetingTime: "", memberCount: 10, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-11', number: 11, name: "INTERCESSION", category: 'Spiritualité', 
    leaderName: "Sentinelles", leaderTitle: "Resp.",
    meetingDay: "Lundi et Jeudi", meetingTime: "21:00", memberCount: 22, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-12', number: 12, name: "LOUANGE", category: 'Culte', 
    leaderName: "Luc Mulamba", leaderTitle: "Berger", vpName: "Marc Assani", vpTitle: "Frère",
    meetingDay: "Lundi, Jeudi, Samedi", meetingTime: "17:00", memberCount: 45, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-13', number: 13, name: "SŒURS", category: 'Social', 
    leaderName: "Louise Mwadi", leaderTitle: "Bergère",
    meetingDay: "Mardi", meetingTime: "14:00", memberCount: 70, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-14', number: 14, name: "HOMMES ADULTES", category: 'Social', 
    leaderName: "Dieudonné Mujanewa", leaderTitle: "",
    meetingDay: "Mardi", meetingTime: "17:00", memberCount: 40, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-15', number: 15, name: "DÉCORATION", category: 'Opérations', 
    leaderName: "Benita Muikewu", leaderTitle: "Sœur", vpName: "Thallycia Kayembe", vpTitle: "Sœur", secondVpName: "Marthia Kapinga", secondVpTitle: "Sœur",
    meetingDay: "", meetingTime: "", memberCount: 15, reportStatus: 'En retard' 
  },
  { 
    id: 'dept-16', number: 16, name: "SOCIAL", category: 'Social', 
    leaderName: "Annie Mambo", leaderTitle: "Pasteure", vpName: "Ami Kabongo", vpTitle: "Berger",
    meetingDay: "", meetingTime: "", memberCount: 18, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-17', number: 17, name: "ECOLE DE DIMANCHE", category: 'Formation', 
    leaderName: "Dora Nanga", leaderTitle: "Sœur", vpName: "Myschael Ntumba", vpTitle: "Berger", secondVpName: "Sylvain Losala", secondVpTitle: "2ème VP",
    meetingDay: "Mardi", meetingTime: "17:00", memberCount: 55, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-18', number: 18, name: "BAPTÊME ET SAINTE-CÈNE", category: 'Culte', 
    leaderName: "Baudoin Tshuikamba", leaderTitle: "",
    meetingDay: "", meetingTime: "", memberCount: 8, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-19', number: 19, name: "SÉCURITÉ", category: 'Opérations', 
    leaderName: "Augustin Malela", leaderTitle: "Berger", vpName: "Raphael Kapiamba", vpTitle: "Berger",
    meetingDay: "Samedi", meetingTime: "16:00", memberCount: 25, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-20', number: 20, name: "TRANSPORT", category: 'Logistique', 
    leaderName: "Devos Sanduku", leaderTitle: "Berger", vpName: "Toupemuni", vpTitle: "Frère",
    meetingDay: "", meetingTime: "", memberCount: 10, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-21', number: 21, name: "SANTÉ", category: 'Social', 
    leaderName: "Francky", leaderTitle: "Frère",
    meetingDay: "", meetingTime: "", memberCount: 6, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-22', number: 22, name: "FIANÇAILLES", category: 'Famille', 
    leaderName: "Direction Pastorale", leaderTitle: "",
    meetingDay: "Jeudi", meetingTime: "17:00", memberCount: 5, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-23', number: 23, name: "PARTENARIAT", category: 'Administration', 
    leaderName: "Berry Biboy", leaderTitle: "Frère", vpName: "Clementine Bomeki", vpTitle: "Bergère", secondVpName: "Zacharie Amisi", secondVpTitle: "Berger",
    meetingDay: "", meetingTime: "", memberCount: 12, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-24', number: 24, name: "HYGIÈNE ET DÉCORATION", category: 'Opérations', 
    leaderName: "Claudine Kabedi", leaderTitle: "Bergère",
    meetingDay: "", meetingTime: "", memberCount: 15, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-25', number: 25, name: "FORMATION ET CAPACITÉS", category: 'Formation', 
    leaderName: "Jean-Didier Bikakala", leaderTitle: "Berger", vpName: "Bellange Kisala", vpTitle: "Sœur",
    meetingDay: "", meetingTime: "", memberCount: 20, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-26', number: 26, name: "EVÉNEMENTIEL", category: 'Opérations', 
    leaderName: "TBA", leaderTitle: "",
    meetingDay: "", meetingTime: "", memberCount: 8, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-27', number: 27, name: "CELLULES DE MAISONS", category: 'Spiritualité', 
    leaderName: "Willy Muka", leaderTitle: "Berger", vpName: "Mardoche Madi", vpTitle: "Berger", secondVpName: "Luc Mwepu", secondVpTitle: "Frère",
    meetingDay: "", meetingTime: "", memberCount: 120, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-28', number: 28, name: "CÉNACLE LECTURE BIBLE", category: 'Formation', 
    leaderName: "Joel Lumbala", leaderTitle: "Frère", vpName: "Emmanuel Kanku", vpTitle: "Frère",
    meetingDay: "Mercredi", meetingTime: "15:00", memberCount: 25, reportStatus: 'À jour' 
  },
  { 
    id: 'dept-29', number: 29, name: "CONSTRUCTION", category: 'Logistique', 
    leaderName: "Papy Kongolo", leaderTitle: "Berger", vpName: "Baudoin Tshuikamba", vpTitle: "", secondVpName: "Pierre", secondVpTitle: "Frère",
    meetingDay: "", meetingTime: "", memberCount: 15, reportStatus: 'À jour' 
  }
];

// PROGRAMME ANNUEL 2026 - FOCUS SUR JÉSUS
// ⚠️ DEPRECATED: This mock data is no longer used.
// Weekly services are now stored in Firestore collection 'weeklyServices'
// Annual programme 2026 is now stored in Firestore collection 'annualProgramme'
// Use services/weeklyServicesService.ts and services/annualProgrammeService.ts instead
export const mockEvents: Event[] = [
  { id: 'ev-1', title: 'ÉCOLE DE LA COMMUNAUTÉ', description: 'Formation et enseignement.', start: new Date('2026-01-04T17:00:00'), end: new Date('2026-01-09T20:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Direction' },
  { id: 'ev-2', title: '12 JOURS DE PRIÈRES', description: 'Pour dédicacer l\'année 2026.', start: new Date('2026-01-19T17:00:00'), end: new Date('2026-01-30T20:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Intercession' },
  { id: 'ev-3', title: '28 MATINÉES DE GLOIRE', description: 'Temps de gloire matinal.', start: new Date('2026-02-01T06:00:00'), end: new Date('2026-02-28T08:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Dévotion' },
  { id: 'ev-4', title: 'CONVENTION DES SŒURS', description: 'Rassemblement des femmes.', start: new Date('2026-03-04T16:00:00'), end: new Date('2026-03-06T19:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Dépt Sœurs' },
  { id: 'ev-5', title: 'CÉLÉBRATION JVI', description: 'Jeunesse Visionnaire.', start: new Date('2026-03-31T16:00:00'), end: new Date('2026-04-03T19:00:00'), location: 'Paroisse La Pentecôte', organizer: 'JVI' },
  { id: 'ev-6', title: 'CIEL OUVERT', description: '50 Jours de Prière.', start: new Date('2026-04-05T17:00:00'), end: new Date('2026-05-24T20:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Direction' },
  { id: 'ev-7', title: 'SÉMINAIRE COUPLES & FAMILLES', description: 'Spécial Familles.', start: new Date('2026-06-21T16:00:00'), end: new Date('2026-06-27T19:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Dépt Famille' },
  { id: 'ev-8', title: 'MOIS ÉVANGÉLIQUE', description: 'Évangélisation intensive.', start: new Date('2026-09-01T00:00:00'), end: new Date('2026-09-30T23:59:59'), location: 'Paroisse La Pentecôte', organizer: 'Évangélisation' },
  { id: 'ev-9', title: 'CONEX 2026', description: 'Convention d\'Excellence.', start: new Date('2026-10-18T09:00:00'), end: new Date('2026-10-25T13:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Direction' },
  { id: 'ev-10', title: 'GALA D\'HONNEUR', description: 'À Karavia.', start: new Date('2026-10-24T18:00:00'), end: new Date('2026-10-24T23:00:00'), location: 'Pullman Hotel Grand Karavia', organizer: 'Protocole' },
  { id: 'ev-11', title: 'PRIÈRE DE FIN D\'ANNÉE', description: '21 Jours de prière.', start: new Date('2026-12-04T17:00:00'), end: new Date('2026-12-24T20:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Intercession' },
  { id: 'ev-12', title: 'CULTE DE NOËL', description: 'Célébration.', start: new Date('2026-12-25T09:00:00'), end: new Date('2026-12-25T12:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Direction' },
  { id: 'ev-13', title: 'SPÉCIAL RÉVEILLON', description: 'Jésus le Centre.', start: new Date('2026-12-31T21:00:00'), end: new Date('2027-01-01T01:00:00'), location: 'Paroisse La Pentecôte', organizer: 'Direction' },
];

// DEPRECATED: Mock finance records - Use real Firestore data from /finances collection instead
export const mockFinanceRecords: FinanceRecord[] = [
  { id: 'f1', type: 'Offrande', amount: 450000, currency: 'CDF', date: '2024-03-10', serviceName: '1er Culte (Dim)', recordedBy: 'Admin' },
  { id: 'f2', type: 'Dîme', amount: 250, currency: 'USD', date: '2024-03-10', memberName: 'Paul Kembe', serviceName: '2ème Culte (Dim)', recordedBy: 'Admin' },
  { id: 'f3', type: 'Dépense', amount: 120, currency: 'USD', date: '2024-03-11', notes: 'Maintenance Sonorisation', recordedBy: 'Admin', isApproved: true },
  { id: 'f4', type: 'Action de grâce', amount: 50000, currency: 'CDF', date: '2024-03-12', memberName: 'Sœur Dora', serviceName: 'Culte Mercredi', recordedBy: 'Admin' },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: 'a1', date: '2024-03-10', sessionName: '1er Culte (Dim)', menCount: 150, womenCount: 210, childrenCount: 95, totalCount: 455 },
];

// DEPRECATED: Use real Firestore data from /announcements collection
// This mock data is kept for reference only and should not be used in production
export const mockAnnouncements: Announcement[] = [
  // { id: 'an1', title: 'Jeûne et Prière', content: 'Trois jours de jeûne pour la nation.', author: 'Apôtre Jean-Clément', date: '2024-03-15' },
];

// DEPRECATED: Use real Firestore data from /resources collection
// This mock data is kept for reference only and should not be used in production
export const mockResources: Resource[] = [
  // { id: 'r1', name: 'Notes du Sermon', type: 'Notes', url: '#', uploadDate: '2024-03-01' },
];

export const mockTasks: Task[] = [
  { id: 't1', title: 'Rapport mensuel secrétariat', assignedTo: 'Sarah Kabeya', dueDate: '2024-03-31', status: 'À faire' },
];

export const mockPrayerRequests: PrayerRequest[] = [
  { id: 'p1', request: 'Intercession pour la jeunesse.', submittedBy: 'Fr. Luc', isPrivate: false, date: '2024-03-14' },
];
