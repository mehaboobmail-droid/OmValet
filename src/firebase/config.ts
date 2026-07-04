import { z } from "zod";

/**
 * Public Firebase web config. These values are safe to expose to the browser —
 * data access is enforced by database security rules, not by config secrecy.
 * NEXT_PUBLIC_* vars must be referenced statically so Next.js can inline them.
 */
const configSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  databaseURL: z.string().url(),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
});

export const firebaseConfig = configSchema.parse({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
