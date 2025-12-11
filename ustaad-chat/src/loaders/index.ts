import expressLoader from './express';
import { Application } from 'express';
// import { connectToPostgres } from '../connection/postgres';
import socketLoader from '../loaders/socket';
import { Server as HTTPServer } from 'http';
import { connectToPostgres } from "@ustaad/shared";
import { initializeFirebase } from "../services/firebase-con";

export default async ({ expressApp, httpServer }: { expressApp: Application; httpServer: HTTPServer }) => {
  console.log("hello1");

  await connectToPostgres();
  
  // Initialize Firebase for notifications
  try {
    initializeFirebase();
  } catch (error) {
    console.warn("⚠️ Firebase initialization failed, notifications may not work:", error);
  }
  
  expressLoader({ app: expressApp });
  socketLoader(httpServer);
};
