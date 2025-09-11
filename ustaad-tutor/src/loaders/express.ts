import express, { Request, Response } from 'express';
import bodyParser, { json } from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import compression from 'compression';
import hpp from 'hpp';
import { NotFoundError } from '../errors';
import { errorHandler } from '../middlewares';
import config from '../config';

import { tutorRouter } from '../modules/tutor/tutor.routes';
import path from 'path';


export default ({ app }: { app: express.Application }) => {
  // It shows the real origin IP in the heroku or Cloudwatch logs
  app.enable('trust proxy');
  // Set security HTTP headers
  app.use(helmet({
    contentSecurityPolicy: false,
    frameguard: false,
  }));


  // Body parser, reading data from body into req.body
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Prevent parameter pollution
  app.use(
    hpp({
      whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price',
      ],
    })
  );

  app.use(compression());

  app.use((req, res, next) => {
    // Force clear conflicting headers
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("Cross-Origin-Resource-Policy");
    res.removeHeader("Cross-Origin-Opener-Policy");
    res.removeHeader("X-Frame-Options");

    // Or explicitly allow embedding from anywhere
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    next();
  });
  
  

  /**
   * Health Check endpoints
   * @TODO Explain why they are here
   */
  app.get('/status', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'tutor Server is running',
    });
  });

  app.head('/status', (req: Request, res: Response) => {
    res.status(200).end();
  });

  // Middleware that transforms the raw string of req.body into json
  app.use(json());

  app.use(cors());
  app.use(bodyParser.json());

  // Serve static files from uploads directory
  app.use(
    "/uploads", 
    express.static(path.join(__dirname, "../../uploads"))
  );

  // Load all API routes
  app.use(config.api.prefix, tutorRouter);


  app.all('*', async (req, res) => {
    throw new NotFoundError(null);
  });
  // Error-handling middleware (must be registered last)
  app.use(errorHandler);
};
