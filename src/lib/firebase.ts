// Reusable Firebase and Firebase Auth Client Module
// Reads environment configuration from existing .env variables (NEXT_PUBLIC_FIREBASE_*)

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if critical configuration keys exist without exposing actual values in logs
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey.trim() !== "" &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId
  );
}

// Singleton Firebase initialization (safe for Next.js build / SSR prerendering)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured()) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: "select_account",
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Firebase Auth initialization skipped:", error);
    }
  }
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  if (!isFirebaseConfigured()) return null;
  try {
    if (!app) {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    }
    auth = getAuth(app);
    return auth;
  } catch {
    return null;
  }
}

export function getGoogleProvider(): GoogleAuthProvider | null {
  if (googleProvider) return googleProvider;
  if (!isFirebaseConfigured()) return null;
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
  return googleProvider;
}

export { app, auth, googleProvider };

