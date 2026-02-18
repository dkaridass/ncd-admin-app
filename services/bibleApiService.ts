/**
 * Bible API Service
 * 
 * Free Bible verse API with no authentication required
 * Documentation: https://bible-api.com/
 * 
 * Features:
 * - Fetch verses by reference (e.g., "John 3:16")
 * - Multiple translations supported (KJV, WEB, etc.)
 * - No rate limits
 * - CORS enabled
 */

export interface BibleVerse {
    reference: string;
    verses: Array<{
        book_id: string;
        book_name: string;
        chapter: number;
        verse: number;
        text: string;
    }>;
    text: string;
    translation_id: string;
    translation_name: string;
    translation_note: string;
}

const API_BASE_URL = 'https://bible-api.com';

/**
 * Cache verses in localStorage to reduce API calls
 */
const CACHE_PREFIX = 'bible_verse_';
const CACHE_EXPIRY_DAYS = 30; // Cache verses for 30 days

interface CachedVerse {
    data: BibleVerse;
    timestamp: number;
}

const getCacheKey = (reference: string, translation: string): string => {
    return `${CACHE_PREFIX}${reference.toLowerCase()}_${translation}`;
};

const getCachedVerse = (reference: string, translation: string): BibleVerse | null => {
    try {
        const key = getCacheKey(reference, translation);
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp }: CachedVerse = JSON.parse(cached);
        const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const isExpired = Date.now() - timestamp > expiryTime;

        if (isExpired) {
            localStorage.removeItem(key);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error reading cached verse:', error);
        return null;
    }
};

const cacheVerse = (reference: string, translation: string, data: BibleVerse): void => {
    try {
        const key = getCacheKey(reference, translation);
        const cached: CachedVerse = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
        console.error('Error caching verse:', error);
    }
};

export const bibleApiService = {
    /**
     * Fetch a Bible verse by reference
     * @param reference - Verse reference (e.g., "John 3:16", "Psalm 23:1-6")
     * @param translation - Translation code (default: "web" - World English Bible)
     * @returns BibleVerse object or null if error
     */
    getVerse: async (reference: string, translation: string = 'web'): Promise<BibleVerse | null> => {
        try {
            // Check cache first
            const cached = getCachedVerse(reference, translation);
            if (cached) {
                console.log(`📖 Bible verse loaded from cache: ${reference}`);
                return cached;
            }

            // Encode reference for URL
            const encodedRef = encodeURIComponent(reference);
            const url = `${API_BASE_URL}/${encodedRef}?translation=${translation}`;

            console.log(`📖 Fetching Bible verse: ${reference} (${translation})`);
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Bible API error: ${response.status} ${response.statusText}`);
                return null;
            }

            const data: BibleVerse = await response.json();

            // Cache the result
            cacheVerse(reference, translation, data);

            return data;
        } catch (error) {
            console.error('Error fetching Bible verse:', error);
            return null;
        }
    },

    /**
     * Get a random verse from a curated list of encouraging verses
     * Useful as a fallback when AI generation fails
     */
    getRandomVerse: async (): Promise<BibleVerse | null> => {
        const encouragingVerses = [
            'Jeremiah 29:11',
            'Philippians 4:13',
            'Psalm 23:1',
            'Proverbs 3:5-6',
            'Isaiah 40:31',
            'Romans 8:28',
            'Joshua 1:9',
            'Matthew 11:28-30',
            'John 3:16',
            'Psalm 46:1',
            '2 Corinthians 12:9',
            'Ephesians 2:8-9',
            'Proverbs 16:3',
            'James 1:12',
            '1 Corinthians 10:13'
        ];

        const randomIndex = Math.floor(Math.random() * encouragingVerses.length);
        const reference = encouragingVerses[randomIndex];

        return await bibleApiService.getVerse(reference);
    },

    /**
     * Parse a verse reference to extract book, chapter, and verse numbers
     * @param reference - e.g., "John 3:16" or "Psalm 23:1-6"
     */
    parseReference: (reference: string): { book: string; chapter: number; verses: string } | null => {
        try {
            // Basic parsing - format: "Book Chapter:Verses"
            const match = reference.match(/^([a-zA-Z\s]+)\s+(\d+):(\d+(?:-\d+)?)$/);
            if (!match) return null;

            return {
                book: match[1].trim(),
                chapter: parseInt(match[2]),
                verses: match[3]
            };
        } catch (error) {
            console.error('Error parsing reference:', error);
            return null;
        }
    },

    /**
     * Clear all cached verses from localStorage
     */
    clearCache: (): void => {
        try {
            const keys = Object.keys(localStorage);
            const verseKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
            verseKeys.forEach(key => localStorage.removeItem(key));
            console.log(`🗑️ Cleared ${verseKeys.length} cached Bible verses`);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
};
