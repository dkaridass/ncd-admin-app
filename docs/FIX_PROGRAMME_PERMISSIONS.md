# Fix: "Missing or insufficient permissions" Error

## Problem
When trying to initialize the Annual Programme 2026, you get:
```
Erreur lors de l'initialisation: Missing or insufficient permissions.
```

## Solution Steps

### Step 1: Verify Your Role in Firestore

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com
   - Select your project
   - Navigate to **Firestore Database** → **Data** tab

2. **Check Your User Document:**
   - Open the `users` collection
   - Find your user document (by your UID or email)
   - Verify the `role` field is set to `SUPER_ADMIN`

3. **If Role is Wrong:**
   - If you're logged in as `admin@ncd.com`, the role should be `SUPER_ADMIN`
   - If it's not, you can manually edit it in Firestore Console:
     - Click on your user document
     - Edit the `role` field
     - Set it to `SUPER_ADMIN`
     - Save

### Step 2: Deploy Firestore Rules

The Firestore security rules need to be deployed to Firebase for them to take effect.

**Option A: Using Firebase CLI (Recommended)**

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Deploy Rules:**
   ```bash
   cd /Users/Apple/Downloads/ncd-la-pentecôte-admin
   firebase deploy --only firestore:rules
   ```

**Option B: Using Firebase Console**

1. Go to Firebase Console → **Firestore Database** → **Rules** tab
2. Copy the contents of `firestore.rules` file
3. Paste into the rules editor
4. Click **Publish**

### Step 3: Verify Rules Are Deployed

After deploying, the rules should include:

```rules
// 14. Weekly Services
match /weeklyServices/{serviceId} {
  allow read: if isAuthenticated();
  allow write: if isSuperAdmin() || isPastor() || isStaffAdmin();
}

// 15. Annual Programme
match /annualProgramme/{eventId} {
  allow read: if isAuthenticated();
  allow write: if isSuperAdmin() || isPastor() || isStaffAdmin();
}
```

### Step 4: Try Again

1. Refresh the app
2. Make sure you're logged in as `admin@ncd.com`
3. Go to `/events` → "Programme Annuel 2026" tab
4. Click "Initialiser le Programme"
5. If you still get an error, the app will now offer to fix your role automatically

---

## Quick Fix: Auto-Fix Role

If you're logged in as `admin@ncd.com` and get a permission error:

1. The app will detect you're `admin@ncd.com`
2. It will offer to fix your role automatically
3. Click "OK" to fix it
4. The page will reload
5. Try initializing again

---

## Still Having Issues?

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for error messages
   - Check what your current role is: `console.log(currentUser)`

2. **Verify Authentication:**
   - Make sure you're logged in
   - Check that your email is exactly `admin@ncd.com`

3. **Check Firestore Console:**
   - Verify your user document exists
   - Verify `role` field is `SUPER_ADMIN`
   - Verify rules are deployed (check Rules tab)

---

## Expected Behavior After Fix

Once fixed, you should be able to:
- ✅ Click "Initialiser le Programme" button
- ✅ See success message: "Programme initialisé avec succès!"
- ✅ See 5 weekly services in "Programme Hebdomadaire" tab
- ✅ See 13 events in "Programme Annuel 2026" tab
