import { Member, Gender, PersonStatus, ChurchRole } from '../types';

// Column name aliases for flexible CSV headers (French/English)
const COLUMN_ALIASES: Record<string, keyof Member> = {
    'nom': 'name',
    'name': 'name',
    'nom complet': 'name',
    'full name': 'name',
    'prenom': 'name',
    'prénom': 'name',

    'telephone': 'phone',
    'téléphone': 'phone',
    'phone': 'phone',
    'tel': 'phone',
    'tél': 'phone',
    'numero': 'phone',
    'numéro': 'phone',

    'whatsapp': 'whatsapp',

    'email': 'email',
    'e-mail': 'email',
    'mail': 'email',
    'courriel': 'email',

    'sexe': 'gender',
    'genre': 'gender',
    'gender': 'gender',

    'adresse': 'address',
    'address': 'address',

    'commune': 'commune',
    'quartier': 'commune',

    'date de naissance': 'birthDate',
    'naissance': 'birthDate',
    'birthday': 'birthDate',
    'birth date': 'birthDate',

    'date adhesion': 'joinDate',
    "date d'adhésion": 'joinDate',
    'join date': 'joinDate',
    'date arrivée': 'joinDate',

    'statut': 'status',
    'status': 'status',

    'rôle': 'role',
    'role': 'role',
    'titre': 'role',

    'etat civil': 'civilState',
    'état civil': 'civilState',
    'civil state': 'civilState',

    'reference': 'reference',
    'référence': 'reference',
    'parrain': 'reference',

    'baptisé': 'isBaptised' as any,
    'baptise': 'isBaptised' as any,
    'baptised': 'isBaptised' as any,
};

export interface CsvParseResult {
    headers: string[];
    rows: Record<string, string>[];
    /** Mapped column name -> Member field */
    columnMapping: Record<string, keyof Member | null>;
}

export interface CsvValidationResult {
    valid: ParsedMemberRow[];
    errors: { row: number; field: string; message: string }[];
    duplicates: { row: number; field: string; value: string }[];
}

export interface ParsedMemberRow {
    rowIndex: number;
    data: Partial<Member>;
}

/**
 * Parse raw CSV text into headers and rows.
 * Handles commas, semicolons, and tabs as delimiters.
 */
export function parseCsvText(text: string): CsvParseResult {
    // Detect delimiter
    const firstLine = text.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';'
        : firstLine.includes('\t') ? '\t'
            : ',';

    const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

    if (lines.length < 2) {
        return { headers: [], rows: [], columnMapping: {} };
    }

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

    // Auto-map columns
    const columnMapping: Record<string, keyof Member | null> = {};
    for (const header of headers) {
        const normalized = header.toLowerCase().trim();
        columnMapping[header] = COLUMN_ALIASES[normalized] || null;
    }

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        rows.push(row);
    }

    return { headers, rows, columnMapping };
}

/**
 * Normalize gender value from various French inputs.
 */
function normalizeGender(val: string): Gender {
    const v = val.toLowerCase().trim();
    if (['f', 'femme', 'féminin', 'female', 'sœur', 'soeur', 'bergère', 'pasteure'].includes(v)) return 'Femme';
    if (['m', 'homme', 'masculin', 'male', 'frère', 'frere', 'berger', 'pasteur'].includes(v)) return 'Homme';
    return 'Homme'; // Default
}

/**
 * Normalize status value.
 */
function normalizeStatus(val: string): PersonStatus {
    const v = val.toLowerCase().trim();
    if (['nouveau', 'nouvelle', 'new', 'visiteur', 'visitor', 'de passage'].includes(v)) return 'Visiteur';
    if (['régulier', 'regulier', 'fidèle', 'fidele', 'regular', 'actif', 'active'].includes(v)) return 'Fidèle';
    if (['archivé', 'archive', 'inactif', 'inactive', 'irrégulier', 'irregulier'].includes(v)) return 'Archivé';
    return 'Fidèle'; // Default
}

/**
 * Normalize boolean from various inputs.
 */
function normalizeBool(val: string): boolean {
    const v = val.toLowerCase().trim();
    return ['oui', 'yes', 'true', '1', 'o', 'y'].includes(v);
}

/**
 * Normalize role value.
 */
function normalizeRole(val: string): ChurchRole {
    const v = val.toLowerCase().trim();
    if (v.includes('pasteur') && !v.includes('pasteure')) return 'Pasteur';
    if (v.includes('pasteure')) return 'Pasteure';
    if (v.includes('berger') && !v.includes('bergère')) return 'Berger';
    if (v.includes('bergère')) return 'Bergère';
    if (v.includes('frère') || v.includes('frere')) return 'Frère';
    if (v.includes('sœur') || v.includes('soeur')) return 'Sœur';
    return 'Frère'; // Default
}

/**
 * Validate and transform parsed CSV rows into Member objects.
 */
export function validateAndTransform(
    parseResult: CsvParseResult,
    existingPhones: Set<string>,
    existingEmails: Set<string>
): CsvValidationResult {
    const valid: ParsedMemberRow[] = [];
    const errors: { row: number; field: string; message: string }[] = [];
    const duplicates: { row: number; field: string; value: string }[] = [];

    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();

    for (let i = 0; i < parseResult.rows.length; i++) {
        const row = parseResult.rows[i];
        const rowNum = i + 2; // +1 for header, +1 for 1-indexing
        const member: Partial<Member> = {};
        let hasError = false;

        // Map each column to a Member field using the mapping
        for (const [header, value] of Object.entries(row)) {
            const field = parseResult.columnMapping[header];
            if (!field || !value.trim()) continue;

            switch (field) {
                case 'name':
                    member.name = value.trim();
                    break;
                case 'phone':
                    member.phone = value.trim();
                    break;
                case 'whatsapp':
                    member.whatsapp = value.trim();
                    break;
                case 'email':
                    member.email = value.trim().toLowerCase();
                    break;
                case 'gender':
                    member.gender = normalizeGender(value);
                    break;
                case 'address':
                    member.address = value.trim();
                    break;
                case 'commune':
                    member.commune = value.trim();
                    break;
                case 'birthDate':
                    member.birthDate = value.trim();
                    break;
                case 'joinDate':
                    member.joinDate = value.trim();
                    break;
                case 'status':
                    member.status = normalizeStatus(value);
                    break;
                case 'role':
                    member.role = normalizeRole(value);
                    break;
                case 'civilState':
                    member.civilState = value.trim();
                    break;
                case 'reference':
                    member.reference = value.trim();
                    break;
                case 'isBaptised' as any:
                    (member as any).isBaptised = normalizeBool(value);
                    break;
            }
        }

        // Validation: name is required
        if (!member.name || member.name.length < 2) {
            errors.push({ row: rowNum, field: 'name', message: 'Nom manquant ou trop court' });
            hasError = true;
        }

        // Duplicate phone check
        if (member.phone) {
            const cleanPhone = member.phone.replace(/\s/g, '');
            if (cleanPhone.length > 3) {
                if (existingPhones.has(cleanPhone) || seenPhones.has(cleanPhone)) {
                    duplicates.push({ row: rowNum, field: 'phone', value: cleanPhone });
                }
                seenPhones.add(cleanPhone);
            }
        }

        // Duplicate email check
        if (member.email && member.email.includes('@')) {
            if (existingEmails.has(member.email) || seenEmails.has(member.email)) {
                duplicates.push({ row: rowNum, field: 'email', value: member.email });
            }
            seenEmails.add(member.email);
        }

        // Set defaults for missing fields
        if (!member.status) member.status = 'Fidèle';
        if (!member.gender) member.gender = 'Homme';
        if (!member.birthDate) member.birthDate = '';
        if (!member.phone) member.phone = '';
        if (!member.email) member.email = '';
        if (!member.joinDate) member.joinDate = new Date().toISOString().split('T')[0];
        if (!member.role) member.role = 'Frère';
        if (!member.family) member.family = 'NCD';
        if (!member.avatarUrl) {
            member.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'N')}&background=random`;
        }

        if (!hasError) {
            valid.push({ rowIndex: i, data: member });
        }
    }

    return { valid, errors, duplicates };
}
