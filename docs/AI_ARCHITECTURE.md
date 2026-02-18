# AI Architecture Summary

## Overview

The NCD La Pentecôte admin app uses **Groq AI** as its centralized AI provider for all text-based AI features. All AI functionality is accessed through a single service layer (`services/aiService.ts`) to ensure consistency and easy maintenance.

## Architecture

### Centralized AI Service

**Location:** `/services/aiService.ts`

All AI calls in the app go through this centralized service, which provides:

- **Model:** `llama-3.3-70b-versatile` (recommended general-purpose model by Groq)
- **API:** Groq Cloud API (OpenAI-compatible endpoint)
- **Configuration:** Environment variable `VITE_GROQ_API_KEY` or localStorage key `ncd_groq_key`

### AI Features

1. **NCD Assistant (Chatbot)**
   - Helps admins/pastors with app usage questions
   - Drafts announcements, emails, SMS templates
   - Answers questions based on app concepts
   - Location: `pages/AssistantPage.tsx`, `pages/AiAssistantPage.tsx`

2. **Rhéma du Jour Commentary**
   - Generates daily Bible verse with meditation/commentary
   - Verse comes from real Bible sources (Bible API or stored)
   - Groq generates short meditation/practical application in French
   - Location: `services/rhemaService.ts`

3. **Prayer Request Generation**
   - Generates prayer text for prayer requests
   - Available to authorized roles (PASTOR, INTERCESSION, SUPER_ADMIN)
   - Saves generated prayer to Firestore `generatedPrayer` field
   - Location: `pages/PrayerRequestsPage.tsx`

4. **Dashboard AI Insights**
   - Strategic briefing for church administration
   - Analyzes members, attendance, and finance data
   - Location: `pages/DashboardPage.tsx`

5. **Announcement Drafting**
   - Generates church announcement drafts
   - Location: `components/communications/AnnouncementDrawer.tsx`

6. **Summarization Features**
   - Department report summarization
   - Finance notes summarization
   - Prayer request summarization
   - Available via `aiService` methods

## Removed Features

### Gemini AI Integration
- **Removed:** All Gemini SDK dependencies (`@google/genai`)
- **Removed:** `services/aiFactory.ts` (Gemini client factory)
- **Removed:** `services/geminiService.ts` (Gemini-specific service)
- **Removed:** `services/mcp.ts` (Model Context Protocol config for Gemini)

### Image Recognition
- **Removed:** `components/ai/VisionModal.tsx` (image recognition widget)
- **Removed:** Vision button from Dashboard
- **Reason:** Admin app doesn't need image recognition features

## Configuration

### Environment Variable

Set `VITE_GROQ_API_KEY` in your `.env` file:

```bash
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### Settings Page

Users can also configure the API key via:
- **Settings > System > AI Configuration**
- Stored in localStorage as `ncd_groq_key`
- Takes precedence over environment variable

### Getting a Groq API Key

1. Visit https://console.groq.com/keys
2. Sign up or log in
3. Create a new API key
4. Copy the key and add it to your `.env` file or Settings page

## Error Handling

All AI calls include proper error handling:
- Checks if API key is configured before making calls
- Shows user-friendly error messages
- Falls back gracefully when AI is unavailable (e.g., Rhéma falls back to Bible API)

## Language Support

- **Primary:** French (for spiritual content and admin tasks)
- **Secondary:** Lingala (`ln`) support in Assistant
- All prompts are designed for French output unless specified

## Security

- API keys are stored securely (localStorage or environment variables)
- No API keys are hardcoded in the codebase
- All AI calls go through the centralized service for consistent security practices
