import { Firestore, collection, doc, writeBatch } from 'firebase/firestore';
import { Department, DepartmentLeader } from '../types';

// Raw Data
const SCHEDULE_DATA = `
1. Corps des Prédicateurs | Jeudi | 17h00
2. Technique | (no day given)
3. Interprétariat | (no day given)
4. Finances | Mardi | 10h00
5. Évangélisation | Samedi | 15h00
6. Dévotion Matinale | Lundi à Samedi | 08h30
7. Protocoles | Samedi | 13h00
8. JVI | Dimanche | 16h00
9. Accueil | Mardi | 17h00
10. Presse | (no day given)
11. Intercession | Lundi et Jeudi | 21h00
12. Louange | Lundi, Jeudi, Samedi | 17h00
13. Sœurs | Mardi | 14h00
14. Hommes Adultes | Mardi | 17h00
15. Décoration | (no day given)
16. Social | (no day given)
17. École de Dimanche (ECODIM) | Mardi | 17h00
18. Baptême et Sainte-Cène | (no day given)
19. Sécurité | Samedi | 16h00
20. Transport | (no day given)
21. Santé | (no day given)
22. Fiançailles | Jeudi | 17h00
23. Partenariat | (no day given)
24. Hygiène et Décoration | (no day given)
25. Formation et Renflement de Capacités | (no day given)
26. Événementiel | (no day given)
27. Cellules de Maisons et Extensions | (no day given)
28. Cénacle pour la Lecture de la Bible | Mercredi | 15h00
29. Construction | (no day given)
`;

const LEADERS_DATA = `
Christian Kitete (Pasteur): Administration
Boanerges Tshebwe (Frère): VP Administration
Olivier Senga (Pasteur): Pasteur Résident / VP Corps des Prédicateurs
Samy Makengu (Pasteur): Corps des Prédicateurs

Dora Nanga – Sœur – ECODIM
Myschael Ntumba – Berger – VP ECODIM
Sylvain Losala – (no title) – 2ème VP ECODIM
Papy Kongolo – Berger – Accueil, Logement, Voyage / Construction
Jean-Didier Bikakala – Berger – Interprétariat / Formation & Renforcement / 2ème VP Familles
Guy Gwamonzi – Frère – VP Interprétariat
Luc Mulamba – Berger – Groupe de Louange
Marc Assani – Frère – Louange JVI
Israel Sendwe – Berger – Presse
Yann Bilolo – Berger – Protocole
Scheila – Sœur – VP Protocole
Huguette Bilonda – Sœur – 2ème VP Protocole
Augustin Malela – Berger – Sécurité
Raphael Kapiamba – Berger – VP Sécurité
Dimitri Mukuna – Berger – Évangélisation
Michel Ngotizo – Frère – VP Évangélisation
Louise Mwadi – Bergère – Sœurs
Grace Tshilombo – Frère – Technique
Ephraim Kaly Nsapu – Frère – VP Technique
Devos Sanduku – Berger – Transport
Toupemuni – Frère – VP Transport
Francky – (no title) – Santé
Paul Kembe – Berger – Finances
Eulalie Shimata – Sœur – VP Finances
Berry Biboy – Frère – Partenariat
Clementine Bomeki – Berger – VP Partenariat
Zacharie Amisi – Berger – 2ème VP Partenariat
Bellange Kisala – Sœur – VP Formation et Renforcement des Capacités
Willy Muka – Berger – Cellules de Maison et Extensions
Mardoche Madi – Berger – VP Cellules de Maison et Extensions
Luc Mwepu – Frère – 2ème VP Cellules de Maison et Extensions
Joel Lumbala – Frère – Cénacle pour la Lecture de la Bible
Emmanuel Kanku – Frère – VP Cénacle pour la Lecture de la Bible
Denis Ngoie – Pasteur – Dévotion Matinale
Bruno Tshitende – Berger – VP Dévotion Matinale
Annie Mambo – Pasteure – Social
Ami Kabongo – Berger – VP Social
Benita Muikewu – Sœur – Décoration
Thallycia Kayembe – Sœur – VP Décoration
`;

const CATEGORY_MAP: Record<string, Department['category']> = {
    'Corps des Prédicateurs': 'Spiritualité',
    'Technique': 'Technique',
    'Interprétariat': 'Culte',
    'Finances': 'Administration',
    'Évangélisation': 'Spiritualité',
    'Dévotion Matinale': 'Spiritualité',
    'Protocoles': 'Culte',
    'JVI': 'Jeunesse',
    'Accueil': 'Culte',
    'Presse': 'Opérations',
    'Intercession': 'Spiritualité',
    'Louange': 'Culte',
    'Sœurs': 'Famille',
    'Hommes Adultes': 'Famille',
    'Décoration': 'Logistique',
    'Social': 'Social',
    'École de Dimanche (ECODIM)': 'Jeunesse',
    'Baptême et Sainte-Cène': 'Culte',
    'Sécurité': 'Opérations',
    'Transport': 'Logistique',
    'Santé': 'Social',
    'Fiançailles': 'Famille',
    'Partenariat': 'Administration',
    'Hygiène et Décoration': 'Logistique',
    'Formation et Renflement de Capacités': 'Formation',
    'Événementiel': 'Opérations',
    'Cellules de Maisons et Extensions': 'Spiritualité',
    'Cénacle pour la Lecture de la Bible': 'Spiritualité',
    'Construction': 'Logistique'
};

const parseSchedule = () => {
    const lines = SCHEDULE_DATA.trim().split('\n');
    const departments: Record<string, Partial<Department>> = {};

    lines.forEach(line => {
        // Remove numbering "1. "
        const cleanLine = line.replace(/^\d+\.\s*/, '');
        const parts = cleanLine.split('|').map(s => s.trim());

        const name = parts[0];
        const dayRaw = parts[1];
        const time = parts.length > 2 ? parts[2] : undefined;

        let meetingDays: string[] = [];
        let meetingDay = dayRaw === '(no day given)' ? undefined : dayRaw;

        if (meetingDay) {
            if (meetingDay.includes(',')) {
                meetingDays = meetingDay.split(',').map(d => d.trim());
            } else if (meetingDay.includes(' et ')) {
                meetingDays = meetingDay.split(' et ').map(d => d.trim());
            } else {
                meetingDays = [meetingDay];
            }
        }

        const normalizedName = name.replace(' (ECODIM)', '');

        // Build department object without undefined values
        const deptData: Partial<Department> = {
            name: name, // Keep original name with ECODIM
            category: CATEGORY_MAP[name] || 'Administration',
            leaders: [],
            memberCount: 0
        };

        // Only add fields if they have values
        if (meetingDay) {
            deptData.meetingDay = meetingDay;
        }
        if (meetingDays.length > 0) {
            deptData.meetingDays = meetingDays;
        }
        if (time) {
            deptData.meetingTime = time;
        }

        departments[normalizedName] = deptData;
    });
    return departments;
};

const parseLeaders = (departments: Record<string, Partial<Department>>) => {
    const lines = LEADERS_DATA.trim().split('\n').filter(l => l.trim().length > 0);

    lines.forEach(line => {
        // Handle "Name (Title): Role" or "Name – Title – Role"
        let name = '';
        let title = '';
        let rolesStr = '';

        if (line.includes(':')) {
            // Format: Christian Kitete (Pasteur): Administration
            const [personPart, rolePart] = line.split(':');
            rolesStr = rolePart;

            const nameMatch = personPart.match(/([^(]+)\s*\(([^)]+)\)/);
            if (nameMatch) {
                name = nameMatch[1].trim();
                title = nameMatch[2].trim();
            } else {
                name = personPart.trim();
            }

        } else if (line.includes('–')) { // En dash
            // Format: Dora Nanga – Sœur – ECODIM
            const parts = line.split('–').map(s => s.trim());
            name = parts[0];
            title = parts[1];
            rolesStr = parts[2]; // Can be multiple roles separated by /
        } else if (line.includes('-')) { // Hyphen
            const parts = line.split('-').map(s => s.trim());
            name = parts[0];
            title = parts[1];
            rolesStr = parts[2];
        }

        // Process roles
        if (rolesStr) {
            const roles = rolesStr.split('/').map(r => r.trim());

            roles.forEach(roleDesc => {
                // Find matching department
                const deptNames = Object.keys(departments);
                let matchedDeptName: string | null = null;
                let roleInDept = 'Membre';

                // Check for VP/2ème VP
                let isVP = roleDesc.startsWith('VP');
                let is2emeVP = roleDesc.includes('2ème VP');

                // Clean role desc to find dept name
                let searchName = roleDesc
                    .replace('2ème VP', '')
                    .replace('VP', '')
                    .replace('Pasteur Résident', '')
                    .trim();

                // Direct match mappings
                const directMappings: Record<string, string> = {
                    'Administration': 'Finances',
                    'ECODIM': 'École de Dimanche',
                    'Formation & Renforcement': 'Formation et Renflement de Capacités',
                    'Formation et Renforcement des Capacités': 'Formation et Renflement de Capacités',
                    'Cellules de Maison et Extensions': 'Cellules de Maisons et Extensions',
                    'Groupe de Louange': 'Louange',
                    'Louange JVI': 'JVI',
                    'Accueil, Logement, Voyage': 'Accueil',
                    'Familles': 'Sœurs' // Fallback for family-related
                };

                if (directMappings[searchName]) {
                    matchedDeptName = directMappings[searchName];
                } else if (directMappings[roleDesc]) {
                    matchedDeptName = directMappings[roleDesc];
                }

                // Fuzzy match if no direct mapping
                if (!matchedDeptName) {
                    matchedDeptName = deptNames.find(d =>
                        d.toLowerCase().includes(searchName.toLowerCase()) ||
                        searchName.toLowerCase().includes(d.toLowerCase())
                    ) || null;
                }

                // Determine Role Title
                if (is2emeVP) roleInDept = '2ème VP';
                else if (isVP) roleInDept = 'VP';
                else if (roleDesc.includes('Pasteur')) roleInDept = 'Pasteur';
                else if (roleDesc === matchedDeptName || roleDesc === searchName) roleInDept = 'Titulaire';

                if (matchedDeptName && departments[matchedDeptName]) {
                    departments[matchedDeptName].leaders?.push({
                        name: name,
                        title: title === '(no title)' ? '' : title,
                        role: roleInDept
                    });
                } else {
                    console.log(`Could not match role "${roleDesc}" to a department for ${name}`);
                }
            });
        }
    });
};

export const importDepartmentsAndLeaders = async (db: Firestore) => {
    console.log("Starting Import...");
    const depts = parseSchedule();
    parseLeaders(depts);

    const batch = writeBatch(db);

    let count = 0;
    for (const [name, data] of Object.entries(depts)) {
        // Create ID from name
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const ref = doc(collection(db, 'departments'), id);

        // Add number based on original list (we can lookup index if needed, or just let it be)
        // We parsed them in order, so we can use that if we want, but 'number' field is in type
        // Let's re-find the number from the schedule string
        const originalLine = SCHEDULE_DATA.trim().split('\n').find(l => l.includes(name));
        const number = originalLine ? parseInt(originalLine.split('.')[0]) : 0;

        batch.set(ref, {
            ...data,
            id: id,
            number: number,
            updatedAt: new Date().toISOString()
        });
        count++;
    }

    await batch.commit();
    console.log(`Successfully imported ${count} departments.`);
    return count;
};
