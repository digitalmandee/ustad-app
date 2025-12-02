import { Router } from 'express';
import CronController from './cron.controller';
// import { authenticateToken } from '../../middlewares/auth';
// import { roleAuth } from '../../middlewares/role-auth';

const router = Router();
const cronController = new CronController();

// All cron routes require authentication and admin role
// router.use(authenticateToken);
// router.use(roleAuth(['ADMIN']));

// Get cron job status
router.get('/status', cronController.getCronStatus);

// Manually trigger cancelled subscription processing
router.post('/trigger-cancelled-subscription', cronController.triggerCancelledSubscription);

// Stop all cron jobs
router.post('/stop', cronController.stopCronJobs);

// Start all cron jobs
router.post('/start', cronController.startCronJobs);

// Stop specific cron jobs
router.post('/stop-cancelled-subscription', cronController.stopCancelledSubscriptionCron);

// Start specific cron jobs
router.post('/start-cancelled-subscription', cronController.startCancelledSubscriptionCron);

// Recurring payment processing route
router.post(
  '/process-due',
  // authenticateJwt,
  // authorizeRoles('ADMIN', 'SUPER_ADMIN'),
  cronController.triggerRecurringPayments
);

export default router; 