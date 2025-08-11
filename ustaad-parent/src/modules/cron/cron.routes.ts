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

// Manually trigger payment verification
router.post('/trigger-payment-verification', cronController.triggerPaymentVerification);

// Stop all cron jobs
router.post('/stop', cronController.stopCronJobs);

// Start all cron jobs
router.post('/start', cronController.startCronJobs);

export default router; 