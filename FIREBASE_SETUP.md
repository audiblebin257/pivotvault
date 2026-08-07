# PivotVault Firebase Setup & Deployment Guide

This guide explains how to run, test, and deploy **PivotVault** entirely on the **Firebase Platform**.

---

## Architecture Summary

1. **Frontend Hosting**: React + Vite static bundle (`frontend/dist/`) hosted on **Firebase Hosting**.
2. **Backend API**: Express API wrapped as a HTTPS Cloud Function (`backend/src/firebaseFunction.js`) hosted on **Firebase Cloud Functions (v2)**.
3. **Authentication**: **Firebase Authentication** integrated into `frontend/src/context/AuthContext.jsx` supporting Email/Password, Google Sign-In, and fallback mock credentials (`demo@pivotvault.com`).
4. **Database & Storage**: Connects to Cloud SQL (PostgreSQL via Prisma ORM) or Firebase Firestore.

---

## 1. Prerequisites

1. **Node.js 18+** installed.
2. A **Firebase Account** (free tier / Blaze pay-as-you-go for Cloud Functions).
3. **Firebase CLI** installed locally or via `npx firebase-tools`.

---

## 2. Setting Up Your Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Name your project (e.g. `pivotvault-app`).
3. Enable **Firebase Authentication** in the console:
   - Go to **Build > Authentication > Sign-in method**.
   - Enable **Email/Password** and **Google**.
4. Enable **Firebase Hosting**:
   - Go to **Build > Hosting** and click **Get Started**.
5. Enable **Cloud Functions**:
   - Upgrade project to the **Blaze (Pay as you go)** plan (required by Google Cloud for Node Functions execution).

---

## 3. Local Configuration

### A. Firebase CLI Project Link
Update `.firebaserc` with your actual project ID:
```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

Or run:
```bash
npx firebase login
npx firebase use --add
```

### B. Frontend Environment Variables
In `frontend/.env` (or `frontend/.env.local`), add your web app credentials from **Firebase Console > Project Settings**:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

---

## 4. Local Testing with Firebase Emulators

You can test the entire frontend & serverless backend pipeline locally using Firebase Emulators:

```bash
# Build frontend and start Firebase Emulators
npm run emulate:firebase
```

Access points:
- **Hosting**: `http://localhost:5000`
- **Functions API**: `http://localhost:5001/pivotvault-app/us-central1/api`
- **Emulator Emulator UI**: `http://localhost:4000`

---

## 5. Deploying to Production

When ready to deploy your application to live production:

```bash
# Log in to Firebase (one-time setup)
npx firebase login

# Build frontend & deploy hosting + functions
npm run deploy:firebase
```

Or deploy components individually:
```bash
# Deploy Frontend Hosting only
npx firebase deploy --only hosting

# Deploy Backend Cloud Functions only
npx firebase deploy --only functions
```

---

## 6. Troubleshooting

- **CORS Errors**: `backend/src/index.js` includes `origin.includes("web.app")` and `origin.includes("firebaseapp.com")` in the CORS whitelist.
- **SPA 404 on Refresh**: Controlled by `"rewrites": [{"source": "**", "destination": "/index.html"}]` in `firebase.json`.
