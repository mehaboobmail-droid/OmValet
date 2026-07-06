/**
 * Update a staff/admin account's email and/or password with the Admin SDK.
 *
 * Usage:
 *   npm run update-admin -- <uid-or-current-email> [--email new@x.com] [--password "NewPass"]
 *
 * Examples:
 *   npm run update-admin -- mehaboobmail@gmail.com --password "NewStrongPass"
 *   npm run update-admin -- mehaboobmail@gmail.com --email owner@omvalet.shop
 *   npm run update-admin -- <uid> --email a@b.com --password "NewPass"
 *
 * The account's uid never changes, so admin rights (admins/{uid}) are kept.
 * When the email changes, the display copy at valets/{uid}/email is updated too.
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

function parseArgs(argv) {
  const identifier = argv[0] && !argv[0].startsWith("--") ? argv[0] : undefined;
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--email") flags.email = argv[++i];
    else if (argv[i] === "--password") flags.password = argv[++i];
  }
  return { identifier, ...flags };
}

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    "Usage: npm run update-admin -- <uid-or-current-email> [--email new@x.com] [--password \"NewPass\"]",
  );
  process.exit(1);
}

async function main() {
  loadEnv();

  const { identifier, email, password } = parseArgs(process.argv.slice(2));
  if (!identifier) usage("Provide the account's uid or current email.");
  if (!email && !password) usage("Provide --email and/or --password to change.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) usage("Invalid --email.");
  if (password && password.length < 6) usage("--password must be at least 6 characters.");

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!serviceAccount || !databaseURL) {
    usage("FIREBASE_SERVICE_ACCOUNT and NEXT_PUBLIC_FIREBASE_DATABASE_URL are required.");
  }

  const app = initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
    databaseURL,
  });
  const auth = getAuth(app);
  const db = getDatabase(app);

  // Resolve the account (email contains "@", otherwise treat as uid).
  let user;
  try {
    user = identifier.includes("@")
      ? await auth.getUserByEmail(identifier)
      : await auth.getUser(identifier);
  } catch {
    usage(`No account found for "${identifier}".`);
  }

  const changes = {};
  if (email) changes.email = email;
  if (password) changes.password = password;

  try {
    await auth.updateUser(user.uid, changes);
  } catch (error) {
    const code = error?.code || "";
    if (code === "auth/email-already-exists") usage("That email is already in use by another account.");
    if (code === "auth/invalid-email") usage("Invalid --email.");
    throw error;
  }

  // Keep the display email in the profile consistent (login uses Auth, not this).
  if (email) {
    const profileRef = db.ref(`valets/${user.uid}`);
    if ((await profileRef.get()).exists()) {
      await profileRef.update({ email });
    }
  }

  const parts = [];
  if (email) parts.push(`email → ${email}`);
  if (password) parts.push("password updated");
  console.log(`Done for uid ${user.uid}: ${parts.join(", ")}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("update-admin failed:", error?.message || error);
  process.exit(1);
});
