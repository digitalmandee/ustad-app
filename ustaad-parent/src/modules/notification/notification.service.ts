import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@ustaad/shared';

export default class NotificationService {
  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    return await getUserNotifications(userId, page, limit);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await getUnreadNotificationCount(userId);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    return await markNotificationAsRead(notificationId, userId);
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    return await markAllNotificationsAsRead(userId);
  }
}

