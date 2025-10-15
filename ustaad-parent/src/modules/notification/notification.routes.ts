import { Router } from 'express';
import NotificationController from './notification.controller';
import { authenticateJwt } from '../../middlewares/auth';

const router = Router();
const notificationController = new NotificationController();

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications with pagination
 * @access  Private
 */
router.get(
  '/',
  authenticateJwt,
  notificationController.getUserNotifications
);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get(
  '/unread-count',
  authenticateJwt,
  notificationController.getUnreadCount
);

/**
 * @route   PUT /api/v1/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put(
  '/:notificationId/read',
  authenticateJwt,
  notificationController.markAsRead
);

/**
 * @route   PUT /api/v1/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put(
  '/mark-all-read',
  authenticateJwt,
  notificationController.markAllAsRead
);

export default router;

