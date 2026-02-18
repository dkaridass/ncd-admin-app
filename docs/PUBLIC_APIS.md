# Public APIs Used in NCD Admin App

This document lists all public APIs integrated into the application and their purposes.

## 📖 Active Integrations

### 1. Bible-API
- **URL:** https://bible-api.com/
- **Documentation:** https://github.com/public-apis/public-apis#books
- **Purpose:** Fallback verse provider for Rhéma du Jour
- **Authentication:** None
- **Cost:** Free
- **Rate Limits:** None
- **Features Used:**
  - Verse lookup by reference
  - Multiple Bible translations
  - English language support

**Powers:**
- Daily Rhéma when Gemini AI quota exceeded
- Automatic fallback mechanism
- Verse caching (30 days)

---

### 2. Currency Exchange API  
- **URL:** https://github.com/fawazahmed0/currency-api
- **API Endpoint:** https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1
- **Documentation:** https://github.com/fawazahmed0/currency-api#readme
- **Purpose:** Real-time USD/CDF exchange rates
- **Authentication:** None
- **Cost:** Free
- **Rate Limits:** None
- **Features Used:**
  - Latest exchange rates
  - Historical rates
  - 150+ currency support

**Powers:**
- Live USD/CDF rate on Finance Dashboard
- Currency conversion helpers
- 24-hour rate caching
- Quick conversion examples

---

## 🔮 Gemini AI (Existing)
- **Service:** Google Gemini API
- **Model:** gemini-2.0-flash
- **Purpose:** Primary Rhéma du Jour generation
- **Authentication:** API Key (VITE_GEMINI_API_KEY)
- **Cost:** Free tier with quota limits
- **Features Used:**
  - AI-powered verse selection
  - French localization
  - Thematic verse generation

**Note:** Bible-API serves as fallback when Gemini quota exhausted.

---

## 📊 API Call Patterns

### Rhéma du Jour
1. **Primary:** Gemini AI generates French verse
2. **Fallback:** Bible-API provides English verse if Gemini fails
3. **Cache:** Results stored in Firestore (permanent)

### Exchange Rates
1. **Fetch:** Currency-API called once per 24 hours
2. **Cache:** Rate stored in localStorage (24h expiry)
3. **Display:** Always shows latest cached or fresh rate

---

## 🛠️ Configuration

### Environment Variables
Add to `.env.local`:

```env
# Gemini AI (Required for AI-generated verses)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Bible API (No key needed - fallback only)
# No configuration required

# Currency API (No key needed)
# No configuration required
```

### Service Files
- `/services/aiFactory.ts` - Gemini AI client
- `/services/bibleApiService.ts` - Bible verse fetching
- `/services/currencyApiService.ts` - Exchange rates
- `/services/rhemaService.ts` - Rhéma logic with fallbacks

---

## 🚨 API Health Monitoring

### Check API Status

**Bible API:**  
```bash
curl https://bible-api.com/john 3:16
```

**Currency API:**  
```bash
curl https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json
```

### Expected Response Times
- Bible API: < 200ms
- Currency API: < 300ms
- Gemini AI: < 2s

---

## 📈 Usage Statistics

### Daily API Calls (Per User)
- **Gemini AI:** 1 call/day (Rhéma)  
- **Bible API:** 0-1 calls/day (fallback only)
- **Currency API:** 1 call/day (24h cache)

### Monthly Estimates (100 active users)
- Gemini: ~3,000 calls/month
- Bible API: ~300-500 calls/month (varies based on Gemini availability)
- Currency: ~100 calls/month (shared cache)

---

## 🔐 Privacy & GDPR

### Data Collection
- **None:** All APIs used do not collect personal user data
- **Client-Side:** All API calls made from user's browser
- **No Tracking:** APIs don't track or store user behavior

### Data Storage
- **Bible Verses:** Cached in browser localStorage (user device)
- **Exchange Rates:** Cached in browser localStorage (user device)
- **No Server Storage:** API responses not stored in Firebase/backend

---

## 🆘 Troubleshooting

### Bible API Not Working
**Symptoms:** Rhéma du Jour shows "Chargement..." indefinitely  
**Solution:**
1. Check browser console for errors
2. Verify API status: https://bible-api.com/
3. Clear cache: `bibleApiService.clearCache()`
4. Fallback: App will still try Gemini

### Currency API Not Working
**Symptoms:** Exchange rate card shows "Données non disponibles"  
**Solution:**
1. Check browser console
2. Click "Réessayer" button
3. App uses last cached rate if available
4. API typically recovers within minutes

### Gemini API Quota Exceeded
**Symptoms:** "📖 Gemini failed, falling back to Bible API..." in console  
**Solution:**
1. Normal behavior - Bible API takes over automatically
2. No user action required
3. Quota resets daily
4.  Consider upgrading Gemini plan for high traffic

---

## 📚 Additional Resources

- **Public APIs Repository:** https://github.com/public-apis/public-apis
- **Bible API GitHub:** https://github.com/7sheep/bible-api
- **Currency API GitHub:** https://github.com/fawazahmed0/currency-api
- **Gemini API Docs:** https://ai.google.dev/gemini-api/docs

---

**Last Updated:** 2026-01-22  
**Maintained By:** NCD Development Team  
**Questions:** Contact system administrator
