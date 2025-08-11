import expressLoader from './express';
import cronLoader from './cron';
import { Application } from 'express';
// import { connectToPostgres } from '../connection/postgres';
import { connectToPostgres } from "@ustaad/shared";

export default async ({ expressApp }: { expressApp: Application }) => {
  console.log("hello1")
  
  await connectToPostgres();
  expressLoader({ app: expressApp });
  
  // Initialize cron services after database connection
  await cronLoader();
  
  // Logger.info("✌️ Express loaded ");
};
