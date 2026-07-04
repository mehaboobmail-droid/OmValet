import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { firebaseConfig } from "./config";

/** Lazily-initialised singletons for the browser Firebase SDK. */
function firebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function clientAuth(): Auth {
  return getAuth(firebaseApp());
}

export function clientDb(): Database {
  return getDatabase(firebaseApp());
}
