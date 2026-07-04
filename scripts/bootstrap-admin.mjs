/**
 * Bootstrap the first admin account on a fresh Firebase project.
 *
 * This portal has no public sign-up — staff are provisioned by an admin, so
 * the very first admin must be created out-of-band with the Admin SDK. Run
 * this once per new project; it is idempotent (safe to re-run).
 *
 * Usage:
 *   node scripts/bootstrap-admin.mjs <email> <password>
 * or set BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD in the environment.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT and NEXT_PUBLIC_FIREBASE_DATABASE_URL,
 * read from .env.local if present.
 */
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const eq = line.indexOf("=");
      if (eq <= 0 || line.trimStart().startsWith("#")) continue;
      const key = line.slice(0, eq).trim();
      if (!(key in process.env)) process.env[key] = line.slice(eq + 1);
    }
  } catch {
    // No .env.local — rely on the ambient environment.
  }
}

async function main() {
  loadEnv();

  const email = process.argv[2] || process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.argv[3] || process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error(
      "Usage: node scripts/bootstrap-admin.mjs <email> <password>\n" +
        "(or set BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD)",
    );
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!serviceAccount || !databaseURL) {
    console.error(
      "FIREBASE_SERVICE_ACCOUNT and NEXT_PUBLIC_FIREBASE_DATABASE_URL are required.",
    );
    process.exit(1);
  }

  const app = initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
    databaseURL,
  });
  const auth = getAuth(app);
  const db = getDatabase(app);

  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, { password });
    console.log(`Existing user promoted to admin: ${email}`);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    const created = await auth.createUser({
      email,
      password,
      displayName: "Admin",
    });
    uid = created.uid;
    console.log(`Admin user created: ${email}`);
  }

  await db.ref(`admins/${uid}`).set(true);
  const profileRef = db.ref(`valets/${uid}`);
  if (!(await profileRef.get()).exists()) {
    await profileRef.set({
      name: "Admin",
      email,
      empId: "",
      phone: "",
      createdAt: new Date().toISOString(),
    });
  }

  console.log(`Done. ${email} can now sign in at /login and access Admin.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Bootstrap failed:", error?.message || error);
  process.exit(1);
});
