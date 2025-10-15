import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';
import NotificationService from './notification.service';

export default class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get user notifications with pagination
   */
  getUserNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.notificationService.getUserNotifications(userId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Notifications fetched successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch notifications',
      });
    }
  };

  /**
   * Get unread notification count
   */
  getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const count = await this.notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        message: 'Unread count fetched successfully',
        data: { count },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch unread count',
      });
    }
  };

  /**
   * Mark a notification as read
   */
  markAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { notificationId } = req.params;

      const success = await this.notificationService.markAsRead(notificationId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification marked as read',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark notification as read',
      });
    }
  };

  /**
   * Mark all notifications as read
   */
  markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const count = await this.notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: { count },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark all notifications as read',
      });
    }
  };
}

