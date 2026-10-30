// Firebase Admin SDK Server-Only Singleton
// Strictly runs in Node.js server environments (Route Handlers, Server Actions).
// Never import this file into Client Components or browser bundles.

import { initializeApp, getApps, cert, applicationDefault, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

if (typeof window !== "undefined") {
  throw new Error("Security Violation: firebaseAdmin cannot be imported on the client side.");
}

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail?: string;
  privateKey?: string;
}

/**
 * Safely parses server-side Firebase Admin credentials from environment variables.
 * Handles escaped newline characters in private keys from deployment environments (e.g. Vercel).
 */
function getAdminCredentials(): FirebaseAdminConfig {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "suprilo";

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Unescape literal \n into real newlines if passed in environment strings
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

/**
 * Returns true if server service account credentials are fully configured.
 * Does not leak secret values in logs or exceptions.
 */
export function isFirebaseAdminConfigured(): boolean {
  const { clientEmail, privateKey } = getAdminCredentials();
  return Boolean(clientEmail && privateKey);
}

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

/**
 * Returns the singleton Firebase Admin App instance.
 * Supports lazy initialization so build-time static generation does not fail if secrets are absent.
 */
export function getFirebaseAdminApp(): App {
  if (adminApp) return adminApp;

  // Prevent duplicate initialization in local development hot-reload
  const apps = getApps();
  if (apps.length > 0 && apps[0]) {
    adminApp = apps[0];
    return adminApp;
  }

  const { projectId, clientEmail, privateKey } = getAdminCredentials();

  if (clientEmail && privateKey) {
    adminApp = initializeApp(
      {
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      },
      "suprilo-admin"
    );
    return adminApp;
  }

  // Fallback: If running inside Google Cloud / ADC environment with default credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    adminApp = initializeApp(
      {
        credential: applicationDefault(),
        projectId,
      },
      "suprilo-admin"
    );
    return adminApp;
  }

  throw new Error(
    "Firebase Admin SDK initialization failed: Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY environment variables."
  );
}

/**
 * Returns the singleton Firebase Admin Auth service.
 */
export function getFirebaseAdminAuth(): Auth {
  if (adminAuth) return adminAuth;
  const app = getFirebaseAdminApp();
  adminAuth = getAuth(app);
  return adminAuth;
}
