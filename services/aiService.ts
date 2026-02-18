/**
 * Centralized AI Service using Groq
 * 
 * This service provides all AI functionality for the NCD La Pentecôte admin app.
 * All AI calls go through this layer to ensure consistency and easy maintenance.
 * 
 * Models Used:
 * - llama-3.3-70b-versatile: General purpose chat/completions (recommended by Groq)
 * 
 * Configuration:
 * - API Key: Set via VITE_GROQ_API_KEY environment variable or localStorage 'ncd_groq_key'
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GroqResponse {
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Get Groq API key from environment or localStorage
 */
const getGroqApiKey = (): string => {
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    const storedKey = localStorage.getItem('ncd_groq_key');
    return storedKey || envKey || '';
};

/**
 * Make a Groq API call
 */
const callGroq = async (
    messages: GroqMessage[],
    options: {
        temperature?: number;
        max_tokens?: number;
        response_format?: { type: 'json_object' | 'text' };
    } = {}
): Promise<string> => {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured. Please set VITE_GROQ_API_KEY or configure in Settings > System.');
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 1000,
            ...(options.response_format && { response_format: options.response_format })
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Groq API error (${response.status}):`, errorText);
        
        if (response.status === 401 || response.status === 403) {
            throw new Error('Invalid or missing GROQ_API_KEY. Please configure in Settings > System.');
        }
        if (response.status === 429) {
            throw new Error('Groq API rate limit exceeded. Please try again later.');
        }
        
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data: GroqResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
        throw new Error('Empty response from Groq API');
    }

    return content;
};

/**
 * Centralized AI Service
 */
export const aiService = {
    /**
     * Check if Groq API is configured
     */
    isConfigured: (): boolean => {
        return getGroqApiKey().length > 0;
    },

    /**
     * Generate assistant reply for NCD Assistant chatbot
     * Helps admins/pastors with app usage questions, drafting content, etc.
     */
    generateAssistantReply: async (
        userMessage: string,
        context?: {
            language?: 'fr' | 'ln';
            membersCount?: number;
            recentEvents?: string[];
        }
    ): Promise<string> => {
        const language = context?.language || 'fr';
        
        const systemPrompt = language === 'ln'
            ? `Yo ozali Mayele "Antigravité" mpo na Eglise NCD La Pentecôte.
Mosala na yo ezali kosunga Apôtre Jean-Clément na gestion ya eglise.

PROTOCOL :
1. **LOLOBA** : Lokumu, Bopeto, na Bolingo.
2. **FORMAT** : Komela na TEXTE SIMPLE.
   - TE : Markdown (** gras, * italique).
   - YA MALAMU : Tirets (-) mpo na liste.
3. **VISION** : "Focus sur Jésus".

Sunga bato na:
- Koyebisa nini app esalaka
- Kokoma annonces, emails, SMS templates
- Kotuna mituna ya malamu na app concepts`
            : `Tu es l'Intelligence Artificielle "Antigravité" au service de l'Église NCD La Pentecôte.
Ta mission est d'assister l'Apôtre Jean-Clément et l'administration avec une efficacité céleste.

PROTOCOL D'INTERACTION :
1. **TON** : Noble, Visionnaire, Précis et Chaleureux. Tu parles avec autorité mais humilité.
2. **FORMAT** : Tes réponses doivent être en TEXTE BRUT épuré.
   - INTERDIT : Markdown complexe (pas de gras **, pas d'italique *, pas de titres #).
   - AUTORISÉ : Listes simples avec tirets (-), sauts de ligne pour l'aération.
3. **MISSION** : Tu aides à la gestion, à la rédaction d'annonces, et à l'inspiration spirituelle.
4. **VISION** : Garde toujours en tête le thème "Focus sur Jésus".

Tu aides les admins/pasteurs avec :
- Questions sur l'utilisation de l'app
- Rédaction d'annonces, emails, templates SMS
- Réponses simples basées sur les concepts de l'app (pas de données privées sauf si explicitement demandé)`;

        const contextInfo = context?.membersCount 
            ? `\n\nContexte: ${context.membersCount} membres enregistrés${context.recentEvents?.length ? `, ${context.recentEvents.length} événements récents` : ''}.`
            : '';

        return await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage + contextInfo }
        ]);
    },

    /**
     * Generate Rhéma du Jour commentary
     * The verse itself comes from a real Bible source (Bible API or stored).
     * Groq only generates a short meditation/practical application in French.
     */
    generateRhemaCommentary: async (
        verseText: string,
        verseReference: string,
        dateStr: string
    ): Promise<{
        content: string;
        reference: string;
        theme: string;
        author: string;
    }> => {
        const systemPrompt = `Tu es un assistant spirituel pour l'église 'NCD La Pentecôte'.
Le thème de l'année 2026 est "Focus sur Jésus".

Génère une "Pensée du Jour" (Rhéma) basée sur le verset fourni.

RÈGLES IMPORTANTES:
- Le verset fourni est déjà donné, ne le modifie pas
- Génère une courte méditation/pratique (2-3 phrases) en français basée sur ce verset
- Le thème doit être lié à Jésus et au verset
- Réponds UNIQUEMENT avec un objet JSON au format:
{
  "content": "Le verset biblique complet en français (identique à celui fourni)",
  "reference": "Référence biblique (ex: Jean 3:16)",
  "theme": "Thème lié à Jésus (ex: Amour de Jésus, Jésus Sauveur)",
  "author": "Inspiration Divine"
}`;

        const userPrompt = `Verset: "${verseText}"
Référence: ${verseReference}
Date: ${dateStr}

Génère le Rhéma avec une méditation basée sur ce verset.`;

        const response = await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], {
            response_format: { type: 'json_object' },
            max_tokens: 500
        });

        // Parse JSON response
        const cleanContent = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        return {
            content: parsed.content || verseText,
            reference: parsed.reference || verseReference,
            theme: parsed.theme || 'Focus sur Jésus',
            author: parsed.author || 'Inspiration Divine'
        };
    },

    /**
     * Generate Rhéma du Jour (full generation including verse selection)
     * This generates both the verse and commentary
     */
    generateDailyRhema: async (dateStr: string): Promise<{
        content: string;
        reference: string;
        theme: string;
        author: string;
    }> => {
        const systemPrompt = `Tu es un assistant spirituel pour l'église 'NCD La Pentecôte'.
Le thème de l'année 2026 est "Focus sur Jésus".

Génère une "Pensée du Jour" (Rhéma) pour la date du ${dateStr}.

RÈGLES IMPORTANTES:
- Le verset DOIT parler de Jésus Christ (Sa personne, Son œuvre, Ses promesses, Sa divinité, Son amour, Sa puissance)
- Utilise la traduction Louis Segond 1910
- Le verset doit être en FRANÇAIS
- Le thème doit être lié à Jésus
- Réponds UNIQUEMENT avec un objet JSON au format:
{
  "content": "Le verset biblique complet en français",
  "reference": "Référence biblique (ex: Jean 3:16)",
  "theme": "Thème lié à Jésus (ex: Amour de Jésus, Jésus Sauveur)",
  "author": "Inspiration Divine"
}`;

        const response = await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Génère le Rhéma pour ${dateStr}` }
        ], {
            response_format: { type: 'json_object' },
            max_tokens: 500
        });

        // Parse JSON response
        const cleanContent = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        return {
            content: parsed.content,
            reference: parsed.reference,
            theme: parsed.theme || 'Focus sur Jésus',
            author: parsed.author || 'Inspiration Divine'
        };
    },

    /**
     * Summarize department reports
     * Uses Groq to summarize monthly department reports
     */
    summarizeDepartmentReport: async (reportContent: string): Promise<string> => {
        const systemPrompt = `Tu es un assistant administratif pour l'église NCD La Pentecôte.
Résume le rapport de département suivant de manière concise et structurée.

Règles:
- Sois concis (maximum 150 mots)
- Mets en évidence les points clés
- Ton professionnel et clair
- Langue: Français`;

        return await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Résume ce rapport:\n\n${reportContent}` }
        ], {
            max_tokens: 300
        });
    },

    /**
     * Summarize finance notes/comments (not raw amounts)
     */
    summarizeFinanceNotes: async (notes: string[]): Promise<string> => {
        const notesText = notes.join('\n- ');
        
        const systemPrompt = `Tu es un assistant financier pour l'église NCD La Pentecôte.
Résume les notes et commentaires financiers suivants de manière concise.

Règles:
- Ne mentionne pas les montants spécifiques
- Focus sur les tendances et observations
- Ton professionnel
- Langue: Français`;

        return await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Résume ces notes financières:\n- ${notesText}` }
        ], {
            max_tokens: 300
        });
    },

    /**
     * Summarize prayer requests
     * Example: "résume les requêtes de ce mois sans mentionner les noms"
     */
    summarizePrayerRequests: async (
        requests: Array<{ content: string; category?: string }>,
        options?: { includeNames?: boolean }
    ): Promise<string> => {
        const requestsText = requests.map((req, idx) => 
            `${idx + 1}. ${req.category ? `[${req.category}] ` : ''}${req.content}`
        ).join('\n');

        const systemPrompt = `Tu es un assistant pastoral pour l'église NCD La Pentecôte.
Résume les requêtes de prière suivantes de manière respectueuse et discrète.

Règles:
- ${options?.includeNames ? 'Tu peux mentionner les noms si nécessaire' : 'NE mentionne PAS les noms complets'}
- Sois discret et respectueux
- Regroupe par catégories si pertinent
- Ton compassionnel et biblique
- Langue: Français`;

        return await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Résume ces requêtes de prière:\n\n${requestsText}` }
        ], {
            max_tokens: 400
        });
    },

    /**
     * Generate prayer text for a prayer request
     * Used in Requêtes de prières feature
     */
    generatePrayerForRequest: async (requestContent: string): Promise<string> => {
        const systemPrompt = `Tu es un intercesseur chrétien.
Rédige une courte prière en français (3 à 5 phrases) basée sur la requête fournie.

Règles STRICTES:
- Ton: Compassionnel, rempli de foi, biblique
- Langue: Français
- Longueur: 3-5 phrases
- Termine par "Au nom de Jésus, Amen."
- Sois discret: ne mentionne pas de détails trop sensibles ni de noms complets
- FORMAT: TEXTE BRUT UNIQUEMENT. Interdit d'utiliser des astérisques (*), du gras ou du markdown.`;

        return await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Requête: "${requestContent}"\n\nRésume la requête en une phrase, puis rédige une courte prière basée sur cette requête.` }
        ], {
            max_tokens: 300,
            temperature: 0.8
        });
    },

    /**
     * Generate announcement draft
     * Used for drafting church announcements
     */
    generateAnnouncementDraft: async (topic: string): Promise<string> => {
        const systemPrompt = `Tu es un secrétaire d'église chaleureux et professionnel.
Rédige une annonce pour le bulletin de l'église "NCD La Pentecôte".

Consignes STRICTES:
- Ton: Chaleureux, engageant, spirituel mais clair
- Langue: Français
- Longueur: Environ 50-80 mots
- FORMAT: TEXTE BRUT UNIQUEMENT. Interdit d'utiliser des astérisques (*), du gras ou du markdown.`;

        return await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Sujet: "${topic}"\n\nRédige l'annonce.` }
        ], {
            max_tokens: 200
        });
    },

    /**
     * Generate dashboard AI insight
     * Strategic briefing for church administration
     */
    generateDashboardInsight: async (summary: {
        totalMembers: number;
        attendance?: any;
        financeSummary?: any[];
    }): Promise<{
        impactSpirituel: string;
        vigilanceAdministrative: string;
        focusVisionnaire: string;
    }> => {
        const systemPrompt = `Tu es "L'Intelligence Visionnaire" au service de l'Apôtre Jean-Clément.
Analyse les données de l'église et génère un RAPPORT STRATÉGIQUE FLASH en 3 points précis.

Règles Strictes:
1. Sois BREF (Max 15 mots par point)
2. Ton: Noble, Stratégique, Direct. Pas de salutations.
3. Format JSON uniquement avec ces champs:
   - impactSpirituel: Analyse de la croissance et de la santé spirituelle
   - vigilanceAdministrative: Point critique de gestion ou finance à surveiller
   - focusVisionnaire: Une recommandation prophétique alignée sur la vision`;

        const response = await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyse ces données: ${JSON.stringify(summary)}` }
        ], {
            response_format: { type: 'json_object' },
            max_tokens: 300
        });

        const cleanContent = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanContent);
    }
};
