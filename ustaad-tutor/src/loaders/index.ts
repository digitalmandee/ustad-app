import expressLoader from "./express";
import { Application } from "express";
// import { connectToPostgres } from '../connection/postgres';
import { connectToPostgres } from "@ustaad/shared";
import { initializeFirebase } from "../services/firebase-con";
import jobsLoader from "./jobs";

export default async ({ expressApp }: { expressApp: Application }) => {
  console.log("hello1");

  await connectToPostgres();

  // Initialize Firebase for notifications
  try {
    initializeFirebase();
  } catch (error) {
    console.warn(
      "⚠️ Firebase initialization failed, notifications may not work:",
      error
    );
  }

  expressLoader({ app: expressApp });
  jobsLoader();
  // Logger.info("✌️ Express loaded ");
};
