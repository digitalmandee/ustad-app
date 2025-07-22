import { Request, Response } from 'express';
import { FirebaseService, SendNotificationRequest } from '../services/firebase.service';
import { Notification } from '../models/Notification';
import { DeviceToken } from '../models/DeviceToken';

export class NotificationController {
  private firebaseService: FirebaseService;

  constructor() {
    this.firebaseService = new FirebaseService();
  }

  // Send single notification
  sendNotification = async (req: Request, res: Response) => {
    try {
      const { userId, type, title, body, data } = req.body as SendNotificationRequest;

      await this.firebaseService.sendNotificationToUser(userId, {
        title,
        body,
        data,
      });

      // Save notification to database
      await Notification.create({
        userId,
        type,
        title,
        body,
        data,
        status: 'sent',
      });

      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: error.message,
      });
    }
  };

  // Send bulk notifications
  sendBulkNotifications = async (req: Request, res: Response) => {
    try {
      const { notifications } = req.body as { notifications: SendNotificationRequest[] };

      await this.firebaseService.sendBulkNotifications(notifications);

      res.status(200).json({
        success: true,
        message: 'Bulk notifications sent successfully',
      });
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk notifications',
        error: error.message,
      });
    }
  };

  // Register device token
  registerDeviceToken = async (req: Request, res: Response) => {
    try {
      const { userId, deviceToken, deviceType } = req.body;

      await this.firebaseService.registerDeviceToken(userId, deviceToken, deviceType);

      res.status(200).json({
        success: true,
        message: 'Device token registered successfully',
      });
    } catch (error) {
      console.error('Error registering device token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register device token',
        error: error.message,
      });
    }
  };

  // Unregister device token
  unregisterDeviceToken = async (req: Request, res: Response) => {
    try {
      const { deviceToken } = req.body;

      await this.firebaseService.unregisterDeviceToken(deviceToken);

      res.status(200).json({
        success: true,
        message: 'Device token unregistered successfully',
      });
    } catch (error) {
      console.error('Error unregistering device token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unregister device token',
        error: error.message,
      });
    }
  };

  // Get notification history for user
  getNotificationHistory = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await this.firebaseService.getNotificationHistory(userId, limit);

      res.status(200).json({
        success: true,
        message: 'Notification history retrieved successfully',
        data: notifications,
      });
    } catch (error) {
      console.error('Error getting notification history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification history',
        error: error.message,
      });
    }
  };

  // Mark notification as read
  markNotificationAsRead = async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;

      await this.firebaseService.markNotificationAsRead(notificationId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message,
      });
    }
  };

  // Get user's device tokens
  getUserDeviceTokens = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const deviceTokens = await DeviceToken.findAll({
        where: { userId, isActive: true },
        attributes: ['deviceToken', 'deviceType', 'lastUsedAt'],
      });

      res.status(200).json({
        success: true,
        message: 'Device tokens retrieved successfully',
        data: deviceTokens,
      });
    } catch (error) {
      console.error('Error getting device tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get device tokens',
        error: error.message,
      });
    }
  };

  // Get notification statistics
  getNotificationStats = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const [totalNotifications, unreadNotifications, sentNotifications, failedNotifications] = await Promise.all([
        Notification.count({ where: { userId } }),
        Notification.count({ where: { userId, isRead: false } }),
        Notification.count({ where: { userId, status: 'sent' } }),
        Notification.count({ where: { userId, status: 'failed' } }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Notification statistics retrieved successfully',
        data: {
          total: totalNotifications,
          unread: unreadNotifications,
          sent: sentNotifications,
          failed: failedNotifications,
        },
      });
    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification statistics',
        error: error.message,
      });
    }
  };
} 