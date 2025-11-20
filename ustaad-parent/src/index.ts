import express from 'express';
import config from './config';
import { SessionReminderService } from './services/session-reminder.service';

// Start the server
async function startServer() {
  const app = express();
  await require('./loaders').default({ expressApp: app });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  try {
    const server = app.listen(config.port, () => {
      console.info(`
        \x1b[32m################################################
        🛡️  Server listening on port: ${config.port} 🛡️
        ################################################\x1b[0m
      `);
      
      // Start session reminder cron job
      // SessionReminderService.startReminderCron();
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('\x1b[31mServer error:', error, '\x1b[0m');
      process.exit(1); // Exit the process on critical server errors
    });
  } catch (error) {
    console.error('\x1b[31mFailed to start server:', error, '\x1b[0m');
    process.exit(1); // Exit the process if the server fails to start
  }
}

// Start the server
startServer();





    // "dev": "cross-env NODE_ENV=develop.env nodemon --inspect=5858 -r ts-node/register ./src/index.ts"
