import * as admin from "firebase-admin";
import { getFirebaseApp } from "./firebase-con";
import { Notification, User } from "./models";
import { NotificationType } from "./constant/enums";

export interface NotificationPayload {
  token: string;
  headline: string;
  message: string;
  data?: any;
  imageUrl?: string;
  clickAction?: string;
  userId: string;
}

export interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a push notification to a specific device token
 * @param token - Firebase device token
 * @param headline - Notification title/headline
 * @param message - Notification body message
 * @param data - Optional additional data
 * @param imageUrl - Optional image URL
 * @param clickAction - Optional click action
 * @returns Promise<NotificationResult>
 */
export async function sendNotification(
  userId: string,
  token: string,
  headline: string,
  message: string,
  data?: any,
  imageUrl?: string,
  clickAction?: string
): Promise<NotificationResult> {
  try {
    const firebaseApp = getFirebaseApp();

    const notificationMessage: admin.messaging.Message = {
      token,
      notification: {
        title: headline,
        body: message,
        imageUrl: imageUrl,
      },
      data: data || {},
      android: {
        notification: {
          clickAction: clickAction,
          icon: "ic_notification",
          color: "#4CAF50",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
    };

    const notification = await Notification.create({
      userId: userId,
      type: NotificationType.SYSTEM_NOTIFICATION,
      title: headline,
      body: message,
      deviceToken: token,
      status: "pending",
      isRead: false,
      sentAt: new Date(),
    });

    const response = await firebaseApp.messaging().send(notificationMessage);

    console.log("✅ Notification sent successfully:", response);

    notification.status = "sent";
    notification.sentAt = new Date();
    await notification.save();

    return {
      success: true,
      messageId: response,
    };
  } catch (error: any) {
    console.error("❌ Error sending notification:", error);

    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Send notifications to multiple device tokens
 * @param notifications - Array of notification payloads
 * @returns Promise<NotificationResult[]>
 */
export async function sendBulkNotifications(
  notifications: NotificationPayload[]
): Promise<NotificationResult[]> {
  const promises = notifications.map(async (notification) => {
    return await sendNotification(
      notification.token,
      notification.headline,
      notification.message,
      notification.data,
      notification.imageUrl,
      notification.clickAction
    );
  });

  return Promise.all(promises);
}

/**
 * Send notification to multiple tokens with the same content
 * @param tokens - Array of device tokens
 * @param headline - Notification title/headline
 * @param message - Notification body message
 * @param data - Optional additional data
 * @param imageUrl - Optional image URL
 * @param clickAction - Optional click action
 * @returns Promise<NotificationResult[]>
 */
export async function sendNotificationToMultipleTokens(
  tokens: string[],
  headline: string,
  message: string,
  data?: Record<string, string>,
  imageUrl?: string,
  clickAction?: string
): Promise<NotificationResult[]> {
  try {
    const firebaseApp = getFirebaseApp();

    const notificationMessage: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: headline,
        body: message,
        imageUrl: imageUrl,
      },
      data: data || {},
      android: {
        notification: {
          clickAction: clickAction,
          icon: "ic_notification",
          color: "#4CAF50",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
    };

    const response = await firebaseApp
      .messaging()
      .sendEachForMulticast(notificationMessage);

    console.log(
      `✅ Bulk notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`
    );

    return response.responses.map((resp, index) => ({
      success: resp.success,
      messageId: resp.success ? resp.messageId : undefined,
      error: resp.success ? undefined : resp.error?.message,
    }));
  } catch (error: any) {
    console.error("❌ Error sending bulk notifications:", error);

    // Return error for all tokens
    return tokens.map(() => ({
      success: false,
      error: error.message || "Unknown error occurred",
    }));
  }
}

/**
 * Validate if a Firebase token is valid
 * @param token - Firebase device token to validate
 * @returns Promise<boolean>
 */
export async function validateFirebaseToken(token: string): Promise<boolean> {
  try {
    const firebaseApp = getFirebaseApp();

    // Try to send a dry-run message to validate the token
    await firebaseApp.messaging().send(
      {
        token,
        notification: {
          title: "Test",
          body: "Test",
        },
      },
      true
    ); // dry-run mode

    return true;
  } catch (error: any) {
    console.error("❌ Token validation failed:", error.message);
    return false;
  }
}

/**
 * Send notification to a user with enhanced metadata
 * @param params - Notification parameters including user ID, type, title, body, etc.
 * @returns Promise<NotificationResult>
 */
export async function sendNotificationToUser(
  params: SendNotificationParams
): Promise<NotificationResult> {
  const {
    userId,
    type,
    title,
    body,
    relatedEntityId,
    relatedEntityType,
    actionUrl,
    metadata,
  } = params;

  try {
    // Get user's device token
    const user = await User.findByPk(userId);
    if (!user || !user.deviceId) {
      console.log(`⚠️ User ${userId} has no device token`);

      // Still create notification in DB for in-app viewing
      await Notification.create({
        userId,
        type,
        title,
        body,
        status: "failed",
        isRead: false,
        relatedEntityId,
        relatedEntityType,
        actionUrl,
        metadata,
        sentAt: new Date(),
      });

      return { success: false, error: "No device token" };
    }

    // Create notification record in DB
    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      deviceToken: user.deviceId,
      status: "pending",
      isRead: false,
      relatedEntityId,
      relatedEntityType,
      actionUrl,
      metadata,
      sentAt: new Date(),
    });

    // Prepare data payload for Firebase
    const dataPayload: Record<string, string> = {
      notificationId: notification.id,
      type: type,
      relatedEntityId: relatedEntityId || "",
      relatedEntityType: relatedEntityType || "",
      actionUrl: actionUrl || "",
    };

    // Add metadata to data payload
    if (metadata) {
      Object.keys(metadata).forEach((key) => {
        dataPayload[key] = String(metadata[key]);
      });
    }

    // Send Firebase push notification
    const result = await sendNotification(
      userId,
      user.deviceId,
      title,
      body,
      dataPayload,
      undefined, // imageUrl
      actionUrl
    );

    // Update notification status
    if (result.success) {
      await notification.update({ status: "sent", sentAt: new Date() });
    } else {
      await notification.update({ status: "failed" });
    }

    return result;
  } catch (error: any) {
    console.error(`❌ Error sending notification to user ${userId}:`, error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Send notification to multiple users
 * @param userIds - Array of user IDs
 * @param params - Notification parameters (without userId)
 * @returns Promise<NotificationResult[]>
 */
export async function sendNotificationToUsers(
  userIds: string[],
  params: Omit<SendNotificationParams, "userId">
): Promise<NotificationResult[]> {
  return Promise.all(
    userIds.map((userId) => sendNotificationToUser({ ...params, userId }))
  );
}

/**
 * Get user notifications with pagination
 * @param userId - User ID
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Promise with notifications and pagination info
 */
export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;

  const { count, rows } = await Notification.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    notifications: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      hasNext: page * limit < count,
      hasPrev: page > 1,
    },
  };
}

/**
 * Mark notification as read
 * @param notificationId - Notification ID
 * @param userId - User ID (for security check)
 * @returns Promise<boolean>
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return false;
    }

    await notification.update({ isRead: true, readAt: new Date() });
    return true;
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 * @param userId - User ID
 * @returns Promise<number> - Number of notifications updated
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<number> {
  try {
    const [updateCount] = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
    return updateCount;
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    return 0;
  }
}

/**
 * Get unread notification count for a user
 * @param userId - User ID
 * @returns Promise<number>
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  try {
    return await Notification.count({
      where: { userId, isRead: false },
    });
  } catch (error) {
    console.error("❌ Error getting unread notification count:", error);
    return 0;
  }
}

// Types are already exported above with the interface declarations
