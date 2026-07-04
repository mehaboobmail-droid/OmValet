import "server-only";
import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getDatabase, type Database } from "firebase-admin/database";
import { firebaseConfig } from "./config";

/**
 * Firebase Admin SDK — server only. Used by API routes for privileged
 * operations (OTP verification, staff management, guest status updates)
 * so security rules can stay locked down for browsers.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT (the service-account JSON, single line)
 * in the server environment.
 */
function adminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set. Add the service-account JSON to the server environment.",
    );
  }

  return initializeApp({
    credential: cert(JSON.parse(raw)),
    databaseURL: firebaseConfig.databaseURL,
  });
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminDb(): Database {
  return getDatabase(adminApp());
}
