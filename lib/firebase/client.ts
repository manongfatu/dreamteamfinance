import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, browserLocalPersistence, setPersistence } from "firebase/auth";

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  };
  // Sanity check for missing client env – prevents opaque auth/invalid-api-key
  const missing = Object.entries({
    NEXT_PUBLIC_FIREBASE_API_KEY: config.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: config.projectId,
    NEXT_PUBLIC_FIREBASE_APP_ID: config.appId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: config.storageBucket,
  })
    .filter(([, v]) => !v || v === "undefined" || v === "null")
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(`Firebase client is missing env vars: ${missing.join(", ")}. Ensure they are defined with NEXT_PUBLIC_ prefix in your env and redeploy.`);
  }
  app = getApps().length ? getApps()[0]! : initializeApp(config);
  return app;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  const auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);
  authInstance = auth;
  return auth;
}
