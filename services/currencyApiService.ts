/**
 * Currency Exchange API Service
 * 
 * Free currency exchange rates API with no authentication
 * Documentation: https://github.com/fawazahmed0/currency-api
 * 
 * Features:
 * - Latest exchange rates for 150+ currencies
 * - Historical rates available
 * - No rate limits
 * - No authentication required
 * - CORS enabled
 */

const API_BASE_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1';

export interface ExchangeRate {
    date: string;
    usd: {
        cdf: number;
    };
}

export interface CachedRate {
    rate: number;
    timestamp: number;
    date: string;
}

const CACHE_KEY = 'currency_usd_cdf_rate';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached exchange rate if still valid
 */
const getCachedRate = (): CachedRate | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const data: CachedRate = JSON.parse(cached);
        const isExpired = Date.now() - data.timestamp > CACHE_DURATION_MS;

        if (isExpired) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error reading cached rate:', error);
        return null;
    }
};

/**
 * Cache exchange rate
 */
const cacheRate = (rate: number, date: string): void => {
    try {
        const data: CachedRate = {
            rate,
            timestamp: Date.now(),
            date
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error caching rate:', error);
    }
};

export const currencyApiService = {
    /**
     * Get latest USD to CDF exchange rate
     * @returns Exchange rate or null if error
     */
    getUsdToCdfRate: async (): Promise<{ rate: number; date: string; cached: boolean } | null> => {
        try {
            // Check cache first
            const cached = getCachedRate();
            if (cached) {
                console.log(`💱 Using cached USD/CDF rate: ${cached.rate} (${cached.date})`);
                return {
                    rate: cached.rate,
                    date: cached.date,
                    cached: true
                };
            }

            // Fetch latest rate
            console.log('💱 Fetching latest USD/CDF exchange rate...');
            const url = `${API_BASE_URL}/currencies/usd.json`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Currency API error: ${response.status}`);
                return null;
            }

            const data: ExchangeRate = await response.json();
            const rate = data.usd.cdf;
            const date = data.date;

            // Cache the result
            cacheRate(rate, date);

            console.log(`✅ USD/CDF rate: ${rate} (${date})`);
            return { rate, date, cached: false };

        } catch (error) {
            console.error('Error fetching exchange rate:', error);

            // Try to return cached rate even if expired (better than nothing)
            const cached = getCachedRate();
            if (cached) {
                console.log('⚠️ API failed, using expired cached rate');
                return {
                    rate: cached.rate,
                    date: cached.date,
                    cached: true
                };
            }

            return null;
        }
    },

    /**
     * Convert CDF to USD
     * @param cdfAmount - Amount in Congolese Francs
     * @returns USD equivalent or null if rate unavailable
     */
    convertCdfToUsd: async (cdfAmount: number): Promise<number | null> => {
        const rateData = await currencyApiService.getUsdToCdfRate();
        if (!rateData) return null;

        return cdfAmount / rateData.rate;
    },

    /**
     * Convert USD to CDF
     * @param usdAmount - Amount in US Dollars
     * @returns CDF equivalent or null if rate unavailable
     */
    convertUsdToCdf: async (usdAmount: number): Promise<number | null> => {
        const rateData = await currencyApiService.getUsdToCdfRate();
        if (!rateData) return null;

        return usdAmount * rateData.rate;
    },

    /**
     * Get historical exchange rate for a specific date
     * @param date - Date in YYYY-MM-DD format
     */
    getHistoricalRate: async (date: string): Promise<{ rate: number; date: string } | null> => {
        try {
            console.log(`💱 Fetching historical USD/CDF rate for ${date}...`);
            const url = `${API_BASE_URL}/currencies/usd/${date}.json`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Currency API error: ${response.status}`);
                return null;
            }

            const data: ExchangeRate = await response.json();
            return {
                rate: data.usd.cdf,
                date: data.date
            };

        } catch (error) {
            console.error('Error fetching historical rate:', error);
            return null;
        }
    },

    /**
     * Format currency amount with proper thousands separators
     */
    formatCurrency: (amount: number, currency: 'USD' | 'CDF'): string => {
        const formatted = amount.toLocaleString('fr-FR', {
            minimumFractionDigits: currency === 'USD' ? 2 : 0,
            maximumFractionDigits: currency === 'USD' ? 2 : 0
        });

        return currency === 'USD' ? `$${formatted}` : `FC ${formatted}`;
    },

    /**
     * Clear cached exchange rate
     */
    clearCache: (): void => {
        try {
            localStorage.removeItem(CACHE_KEY);
            console.log('🗑️ Cleared currency rate cache');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
};
