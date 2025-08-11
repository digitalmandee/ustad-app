import expressLoader from './express';
import { Application } from 'express';
// import { connectToPostgres } from '../connection/postgres';
import { connectToPostgres } from "@ustaad/shared";


export default async ({ expressApp }: { expressApp: Application }) => {
  console.log("hello1")
  
  await connectToPostgres();
  
  expressLoader({ app: expressApp });
  // Logger.info("✌️ Express loaded ");
};
