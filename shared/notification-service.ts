import * as admin from "firebase-admin";
import { getFirebaseApp } from "./firebase-con";

export interface NotificationPayload {
  token: string;
  headline: string;
  message: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
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
  token: string,
  headline: string,
  message: string,
  data?: Record<string, string>,
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

    const response = await firebaseApp.messaging().send(notificationMessage);
    
    console.log("✅ Notification sent successfully:", response);
    
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

    const response = await firebaseApp.messaging().sendEachForMulticast(notificationMessage);
    
    console.log(`✅ Bulk notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);
    
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
    await firebaseApp.messaging().send({
      token,
      notification: {
        title: "Test",
        body: "Test",
      },
    }, true); // dry-run mode
    
    return true;
  } catch (error: any) {
    console.error("❌ Token validation failed:", error.message);
    return false;
  }
}

// Types are already exported above with the interface declarations
