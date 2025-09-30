import * as admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Try to load the correct Firebase service account file
    let serviceAccount: any;
    
    try {
      serviceAccount = require("./app/config/ustaad.json");
      console.log("✅ Loaded ustaad.json service account");
    } catch (fileError) {
      // Fallback to environment variables
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };
      console.log("✅ Using Firebase config from environment variables");
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID,
    });

    console.log("✅ Firebase Admin SDK initialized successfully");
    return firebaseApp;
  } catch (error: any) {
    console.error("❌ Firebase initialization failed:", error.message);
    console.error(
      "❌ Make sure you have a valid Firebase service account file in app/config/ or set environment variables"
    );
    throw error;
  }
}

export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
}