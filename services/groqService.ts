/**
 * Groq AI Service
 * 
 * Fast AI inference with Groq Cloud
 * Documentation: https://console.groq.com/docs
 * 
 * Features:
 * - Ultra-fast inference (up to 500 tokens/sec)
 * - Free tier: 14,000 requests/day
 * - Models: Llama 3, Mixtral, Gemma
 * - Excellent for fallback scenarios
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
    usage: {
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

export const groqService = {
    /**
     * Generate a French Bible verse using Groq AI
     * @param dateStr - Date for the Rhema
     * @returns Generated verse with theme and reference
     */
    generateFrenchVerse: async (dateStr: string): Promise<{
        content: string;
        reference: string;
        theme: string;
    } | null> => {
        try {
            const apiKey = getGroqApiKey();
            if (!apiKey) {
                console.warn('⚠️ Groq API key not configured');
                return null;
            }

            console.log(`🚀 Generating Rhema with Groq AI for ${dateStr}...`);

            const systemPrompt = `Tu es un assistant spirituel pour l'église 'NCD La Pentecôte'.
Le thème de l'année 2026 est "Focus sur Jésus".

Génère une "Pensée du Jour" (Rhéma) pour la date du ${dateStr}.

RÈGLES IMPORTANTES:
- Le verset DOIT parler de Jésus Christ (Sa personne, Son œuvre, Ses promesses, Sa divinité, Son amour, Sa puissance)
- Utilise la traduction Louis Segond 1910
- Le verset doit être en FRANÇAIS
- Le thème doit être lié à Jésus

Réponds UNIQUEMENT avec un objet JSON au format:
{
  "content": "Le verset biblique complet en français",
  "reference": "Référence biblique (ex: Jean 3:16)",
  "theme": "Thème lié à Jésus (ex: Amour de Jésus, Jésus Sauveur)"
}`;

            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile', // Fast and capable
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Génère le Rhéma pour ${dateStr}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Groq API error (${response.status}):`, errorText);
                return null;
            }

            const data: GroqResponse = await response.json();
            const content = data.choices[0]?.message?.content;

            if (!content) {
                console.error('Empty response from Groq');
                return null;
            }

            // Parse JSON response
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanContent);

            console.log('✅ Groq AI generated verse:', parsed.reference);
            return {
                content: parsed.content,
                reference: parsed.reference,
                theme: parsed.theme
            };

        } catch (error) {
            console.error('Error with Groq AI:', error);
            return null;
        }
    },

    /**
     * Check if Groq API is configured
     */
    isConfigured: (): boolean => {
        return getGroqApiKey().length > 0;
    },

    /**
     * Test Groq API connection
     */
    testConnection: async (): Promise<boolean> => {
        try {
            const apiKey = getGroqApiKey();
            if (!apiKey) return false;

            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: 'Test' }],
                    max_tokens: 10
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Groq connection test failed:', error);
            return false;
        }
    }
};
