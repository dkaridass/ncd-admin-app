# 🧪 Settings Module - Testing Guide

## Overview

This guide covers testing the **Paramètres / Settings** module, ensuring that global app configuration works correctly and is properly stored in Firestore.

---

## 🔧 Setup

### 1. **Run the Application**

```bash
npm run dev
```

### 2. **Login as SUPER_ADMIN**

- Email: `admin@ncd.com`
- Password: (your Firebase Auth password)

---

## 📋 Test Checklist

### **Test 1: Verify Settings Initialization**

**Steps:**
1. Log in as `admin@ncd.com`
2. Navigate to `/settings`
3. Check browser console for: `✅ App settings loaded`

**Verify:**
- [ ] Settings page loads without errors
- [ ] All tabs are visible: Général, Finances, Programme, Rôles & Fonctions, IA, Sécurité, Système
- [ ] Forms display default values (not empty)

**Check Firestore:**
- [ ] Navigate to Firebase Console → Firestore
- [ ] Verify `/appSettings` collection exists
- [ ] Verify documents exist: `general`, `finance`, `rolesAndFunctions`, `programme`, `ai`

---

### **Test 2: Edit General Settings**

**Steps:**
1. Navigate to `/settings` → "Général" tab
2. Change "Désignation Officielle" to "NCD Test Church"
3. Change "Ville de Siège" to "Kinshasa"
4. Change "E-mail de Contact" to "test@ncd.cd"
5. Click "Enregistrer"

**Verify:**
- [ ] Success message appears: "Paramètres généraux sauvegardés avec succès"
- [ ] Button shows "Sauvegarde..." while saving
- [ ] Settings saved to Firestore (check Firebase Console)
- [ ] Changes persist after page refresh

**Check Firestore:**
- [ ] Navigate to `/appSettings/general` document
- [ ] Verify `churchName` is "NCD Test Church"
- [ ] Verify `city` is "Kinshasa"
- [ ] Verify `email` is "test@ncd.cd"

---

### **Test 3: Edit Finance Settings**

**Steps:**
1. Navigate to `/settings` → "Finances" tab
2. Change "Devise par défaut" to "USD"
3. Change "Compte par défaut" to "Rawbank"
4. Click "Enregistrer"

**Verify:**
- [ ] Success message appears
- [ ] Settings saved to Firestore
- [ ] Default currency updates
- [ ] Default account updates

**Check Firestore:**
- [ ] Navigate to `/appSettings/finance` document
- [ ] Verify `defaultCurrency` is "USD"
- [ ] Verify `defaultAccount` is "rawbank"
- [ ] Verify `accounts` array exists with all 6 accounts

---

### **Test 4: Edit AI Settings**

**Steps:**
1. Navigate to `/settings` → "IA" tab
2. Change "Tonalité des Réponses" to "Formel"
3. Change "Style de Langage" to "Courant"
4. Update "Prompt Système Global" to "Test prompt"
5. Click "Enregistrer"

**Verify:**
- [ ] Success message appears
- [ ] Settings saved to Firestore
- [ ] Changes persist after page refresh

**Check Firestore:**
- [ ] Navigate to `/appSettings/ai` document
- [ ] Verify `tone` is "Formel"
- [ ] Verify `formality` is "Courant"
- [ ] Verify `systemPrompt` is "Test prompt"

---

### **Test 5: View Programme Settings**

**Steps:**
1. Navigate to `/settings` → "Programme" tab

**Verify:**
- [ ] Tab displays placeholder message
- [ ] Message indicates future implementation

**Note:** Full programme management UI will be added in a future version.

---

### **Test 6: View Roles & Functions Settings**

**Steps:**
1. Navigate to `/settings` → "Rôles & Fonctions" tab

**Verify:**
- [ ] Tab displays placeholder message
- [ ] Message indicates future implementation

**Note:** Full roles/functions management UI will be added in a future version.

---

### **Test 7: Permission Check - Non-Admin User**

**Steps:**
1. Log in as a non-admin user (e.g., MEMBER role)
2. Navigate to `/settings`
3. Try to access "Général", "Finances", "IA" tabs

**Verify:**
- [ ] Edit controls are hidden or disabled
- [ ] "Vous n'avez pas l'autorisation de modifier ces paramètres" message appears
- [ ] User can still view settings (read-only)

---

### **Test 8: Real-Time Updates**

**Steps:**
1. Open app in two browser windows
2. In Window 1: Log in as `admin@ncd.com`, change church name in Settings
3. In Window 2: Log in as any user, view Settings

**Verify:**
- [ ] Changes appear in Window 2 automatically (if real-time listener works)
- [ ] Or changes appear after page refresh in Window 2

---

### **Test 9: Error Handling**

**Steps:**
1. Log in as `admin@ncd.com`
2. Navigate to `/settings` → "Général" tab
3. Disconnect from internet (or simulate network error)
4. Try to save settings

**Verify:**
- [ ] Error message appears: "Erreur: [error message]"
- [ ] Error message is user-friendly
- [ ] Form state is preserved (not reset)

---

### **Test 10: Default Settings Initialization**

**Steps:**
1. Delete `/appSettings` collection in Firebase Console
2. Refresh the app
3. Log in as `admin@ncd.com`
4. Navigate to `/settings`

**Verify:**
- [ ] Settings initialize automatically
- [ ] Default values are loaded
- [ ] All documents are created: `general`, `finance`, `rolesAndFunctions`, `programme`, `ai`
- [ ] Forms display default values

**Check Firestore:**
- [ ] Verify all 5 documents exist in `/appSettings` collection
- [ ] Verify default values match expected defaults

---

## ✅ Complete Test Checklist

- [ ] Settings initialization works
- [ ] General settings can be edited and saved
- [ ] Finance settings can be edited and saved
- [ ] AI settings can be edited and saved
- [ ] Programme tab displays placeholder
- [ ] Roles & Functions tab displays placeholder
- [ ] Permission checks work (non-admin cannot edit)
- [ ] Real-time updates work (or refresh works)
- [ ] Error handling works
- [ ] Default settings initialize correctly

---

## 🐛 Troubleshooting

### **Issue: Settings not loading**

**Solution:**
- Check browser console for errors
- Verify Firestore rules allow read access to `/appSettings`
- Check that `appSettingsService.initializeDefaults()` ran successfully
- Verify user is authenticated

### **Issue: Cannot save settings**

**Solution:**
- Verify you are logged in as SUPER_ADMIN
- Check that `hasPermission('MANAGE_SETTINGS')` returns true
- Verify Firestore rules allow write access for SUPER_ADMIN
- Check browser console for error messages

### **Issue: Settings not persisting**

**Solution:**
- Check Firestore Console to verify documents were updated
- Verify `updateAppSettings()` function is being called
- Check browser console for errors during save
- Verify Firestore rules allow write access

---

## 📝 Notes

- **Settings Storage:** All settings are stored in Firestore `/appSettings` collection
- **Real-Time Updates:** Settings use `onSnapshot` listeners for real-time updates
- **Default Initialization:** Settings auto-initialize with defaults if missing
- **Permissions:** Only SUPER_ADMIN can edit settings (via `MANAGE_SETTINGS` permission)
- **Future Work:** Finance account management, Programme defaults UI, Roles/Functions management UI will be added in future versions

---

## 🚀 Next Steps

After testing, the next phase is to:
1. Update Finance components to use `appSettings.finance.accounts`
2. Update Member forms to use `appSettings.rolesAndFunctions`
3. Update Dashboard to use `appSettings.general.churchName`
4. Add full account management UI
5. Add full programme defaults management UI
6. Add full roles/functions management UI

---

**Last Updated:** 2024-01-XX  
**Status:** ✅ Ready for Testing
