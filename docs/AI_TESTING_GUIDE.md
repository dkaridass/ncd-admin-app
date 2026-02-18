# AI Testing Guide

This guide explains how to test all AI features in the NCD La Pentecôte admin app after migrating to Groq.

## Prerequisites

1. **Get a Groq API Key**
   - Visit https://console.groq.com/keys
   - Sign up or log in
   - Create a new API key
   - Copy the key

2. **Configure the API Key**

   **Option A: Environment Variable (Recommended for Development)**
   ```bash
   # Create or edit .env file in project root
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```
   Then restart your dev server.

   **Option B: Settings Page (For Production/Testing)**
   - Log in to the app
   - Navigate to **Settings > System**
   - Scroll to **AI Configuration** section
   - Paste your Groq API key in the "Clé API (Groq)" field
   - Click **Enregistrer**

## Testing Checklist

### 1. NCD Assistant (Chatbot)

**Location:** `/assistant` page

**Test Steps:**
1. Navigate to **Assistant IA** in the sidebar
2. Type a question like: "Comment utiliser l'app pour ajouter un membre?"
3. Verify:
   - ✅ Response appears in French
   - ✅ Response is helpful and relevant
   - ✅ No errors in console

**Expected Behavior:**
- Assistant responds with helpful guidance
- Responses are in French
- Quick actions (Briefing Pastoral, Plan de Sermon, Verset du Jour) work

**Common Issues:**
- If you see "GROQ_API_KEY non configurée", check your configuration
- If responses are slow, Groq is usually fast, but network issues can occur

---

### 2. Rhéma du Jour Commentary

**Location:** Dashboard or wherever Rhéma is displayed

**Test Steps:**
1. Navigate to the page that displays Rhéma
2. If there's a "Generate Rhéma" button, click it
3. Or check if Rhéma is auto-generated for today
4. Verify:
   - ✅ Verse is in French
   - ✅ Reference is provided (e.g., "Jean 3:16")
   - ✅ Theme is related to Jesus
   - ✅ Content is saved to Firestore

**Expected Behavior:**
- Rhéma is generated with a French Bible verse
- Theme focuses on Jesus (per 2026 theme "Focus sur Jésus")
- Falls back to Bible API if Groq fails

**Common Issues:**
- If generation fails, check console for errors
- Fallback to Bible API should work automatically

---

### 3. Prayer Request Generation

**Location:** `/prayer-requests` page

**Test Steps:**
1. Navigate to **Requêtes Prière** in the sidebar
2. Create a new prayer request or use an existing one
3. Click **"Générer une prière avec l'IA"** button (visible only to PASTOR, INTERCESSION, SUPER_ADMIN roles)
4. Wait for generation (should take 2-5 seconds)
5. Verify:
   - ✅ Generated prayer appears below the request content
   - ✅ Prayer is in French
   - ✅ Prayer is respectful and biblical
   - ✅ Prayer is saved to Firestore (check `generatedPrayer` field)
   - ✅ Button changes to "Régénérer" after generation

**Expected Behavior:**
- Prayer is generated based on request content
- Prayer is 3-5 sentences in French
- Prayer ends with "Au nom de Jésus, Amen."
- Generated prayer persists when page is refreshed

**Common Issues:**
- If button doesn't appear, check your role permissions
- If generation fails, check console and verify API key is configured
- Error messages should be user-friendly

---

### 4. Dashboard AI Insights

**Location:** `/dashboard` page

**Test Steps:**
1. Navigate to **Tableau de bord**
2. Look for AI analysis widget or button
3. Click to trigger AI analysis (if available)
4. Verify:
   - ✅ Strategic insights appear
   - ✅ Insights are brief and actionable
   - ✅ Format includes: impactSpirituel, vigilanceAdministrative, focusVisionnaire

**Expected Behavior:**
- AI analyzes church data (members, attendance, finances)
- Provides strategic briefing in 3 points
- Each point is max 15 words
- Insights are saved/displayed in the widget

---

### 5. Announcement Drafting

**Location:** Announcements/Communications page

**Test Steps:**
1. Navigate to **Annonces** or **Communications**
2. Click to create a new announcement
3. Enter a title (e.g., "Programme de Jeûne et Prière")
4. Click **"Générer avec IA"** button
5. Verify:
   - ✅ Draft content appears in the textarea
   - ✅ Content is in French
   - ✅ Content is warm and engaging
   - ✅ Content is 50-80 words

**Expected Behavior:**
- Draft is generated based on title
- Content is appropriate for church announcements
- No markdown formatting (plain text only)

---

## Verification Steps

### Check API Key Configuration

1. Open browser console (F12)
2. Type: `localStorage.getItem('ncd_groq_key')`
3. Should return your API key (or `null` if using env var)
4. Check env var: `import.meta.env.VITE_GROQ_API_KEY` (in console)

### Check Health Status

1. Navigate to **Health Check** page (if available)
2. Verify "Groq AI Configured" shows ✅
3. Check system health data

### Monitor Console

- Open browser DevTools Console
- Watch for:
  - ✅ Success messages: "✅ Groq AI generated..."
  - ❌ Error messages: Check error details
  - ⚠️ Warnings: Usually about missing API key

## Troubleshooting

### Issue: "GROQ_API_KEY non configurée"

**Solution:**
1. Check if API key is set in `.env` file
2. Restart dev server if using env var
3. Or configure via Settings page
4. Verify key is correct (starts with `gsk_`)

### Issue: API Rate Limit Errors

**Solution:**
- Groq free tier: 14,000 requests/day
- Wait a few minutes and retry
- Check Groq console for usage stats

### Issue: Slow Responses

**Solution:**
- Groq is usually very fast (< 1 second)
- Check network connection
- Verify API endpoint is accessible

### Issue: French Content Not Generated

**Solution:**
- Check prompts in `aiService.ts`
- Verify system prompts specify French language
- Check if model supports French (llama-3.3-70b-versatile does)

## Success Criteria

✅ All AI features work without errors  
✅ All responses are in French (where applicable)  
✅ Generated content is saved to Firestore  
✅ Error handling shows user-friendly messages  
✅ No Gemini dependencies remain  
✅ No image recognition features present  
✅ API key can be configured via Settings or env var  

## Next Steps

After successful testing:
1. Document any issues found
2. Update prompts if needed for better results
3. Consider adding more AI features as needed
4. Monitor Groq API usage and costs
