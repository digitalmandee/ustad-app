import * as admin from "firebase-admin";
import { getFirebaseApp } from "./firebase-con";
import { Notification, NotificationType } from "@ustaad/shared";

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send notification to a user
 * @param userId - User ID
 * @param token - Firebase device token
 * @param headline - Notification title/headline
 * @param message - Notification body message
 * @param data - Optional additional data
 * @param imageUrl - Optional image URL
 * @param clickAction - Optional click action URL
 * @returns Promise<NotificationResult>
 */
export async function sendNotificationToUser(
  userId: string,
  token: string,
  headline: string,
  message: string,
  data?: any,
  imageUrl?: string,
  clickAction?: string,
  notificationType?: NotificationType
): Promise<NotificationResult> {
  try {
    // Get Firebase app and send notification
    const firebaseApp = getFirebaseApp();

    // Convert data to Firebase format (all values must be strings)
    const dataPayload: Record<string, string> = {};
    if (data) {
      Object.keys(data).forEach((key) => {
        dataPayload[key] = String(data[key]);
      });
    }

    const notificationMessage: admin.messaging.Message = {
      token: token,
      notification: {
        title: headline,
        body: message,
        imageUrl: imageUrl,
      },
      data: dataPayload,
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

    // Create notification record in DB
    const notification = await Notification.create({
      userId: userId,
      type: notificationType || NotificationType.SYSTEM_NOTIFICATION,
      title: headline,
      body: message,
      deviceToken: token,
      status: "pending",
      isRead: false,
      sentAt: new Date(),
    });

    const response = await firebaseApp.messaging().send(notificationMessage);

    console.log("✅ Notification sent successfully:", response);

    // Update notification status
    notification.status = "sent";
    notification.sentAt = new Date();
    await notification.save();

    return {
      success: true,
      messageId: response,
    };
  } catch (error: any) {
    console.error(`❌ Error sending notification to user ${userId}:`, error);

    // Update notification status to failed if it was created
    try {
      const notification = await Notification.findOne({
        where: { userId, title: headline, body: message },
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
