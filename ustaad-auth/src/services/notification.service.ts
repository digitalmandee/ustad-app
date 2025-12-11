import * as admin from "firebase-admin";
import { getFirebaseApp } from "./firebase-con";
import { Notification, User, NotificationType } from "@ustaad/shared";

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

    // Get Firebase app and send notification
    const firebaseApp = getFirebaseApp();

    const notificationMessage: admin.messaging.Message = {
      token: user.deviceId,
      notification: {
        title: title,
        body: body,
      },
      data: dataPayload,
      android: {
        notification: {
          clickAction: actionUrl,
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

    const response = await firebaseApp.messaging().send(notificationMessage);

    console.log("✅ Notification sent successfully:", response);

    // Update notification status
    await notification.update({ status: "sent", sentAt: new Date() });

    return {
      success: true,
      messageId: response,
    };
  } catch (error: any) {
    console.error(`❌ Error sending notification to user ${userId}:`, error);
    
    // Update notification status to failed if it was created
    try {
      const notification = await Notification.findOne({
        where: { userId, title, body },
        order: [["createdAt", "DESC"]],
      });
      if (notification && notification.status === "pending") {
        await notification.update({ status: "failed" });
      }
    } catch (updateError) {
      // Ignore update errors
    }

    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

