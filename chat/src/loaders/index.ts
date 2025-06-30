import expressLoader from './express';
import { Application } from 'express';
import { connectToPostgres } from '../connection/postgres';
import socketLoader from '../loaders/socket';
import { Server as HTTPServer } from 'http';

export default async ({ expressApp, httpServer }: { expressApp: Application; httpServer: HTTPServer }) => {
  console.log("hello1");

  await connectToPostgres();
  expressLoader({ app: expressApp });
  socketLoader(httpServer);
};
