"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFirebase = initializeFirebase;
exports.getFirebaseApp = getFirebaseApp;
const admin = __importStar(require("firebase-admin"));
let firebaseApp = null;
function initializeFirebase() {
    if (firebaseApp) {
        return firebaseApp;
    }
    try {
        // Try to load the correct Firebase service account file
        let serviceAccount;
        try {
            serviceAccount = require("./noti.json");
            console.log("✅ Loaded ustaad.json service account");
        }
        catch (fileError) {
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
    }
    catch (error) {
        console.error("❌ Firebase initialization failed:", error.message);
        console.error("❌ Make sure you have a valid Firebase service account file in app/config/ or set environment variables");
        throw error;
    }
}
function getFirebaseApp() {
    if (!firebaseApp) {
        return initializeFirebase();
    }
    return firebaseApp;
}
