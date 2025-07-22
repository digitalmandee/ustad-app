import express from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = express.Router();
const notificationController = new NotificationController();

// Send notifications
router.post('/send', notificationController.sendNotification);
router.post('/bulk', notificationController.sendBulkNotifications);

// Device token management
router.post('/token/register', notificationController.registerDeviceToken);
router.post('/token/unregister', notificationController.unregisterDeviceToken);
router.get('/token/user/:userId', notificationController.getUserDeviceTokens);

// Notification history and management
router.get('/history/:userId', notificationController.getNotificationHistory);
router.put('/read/:notificationId', notificationController.markNotificationAsRead);
router.get('/stats/:userId', notificationController.getNotificationStats);

export default router; 