import * as admin from 'firebase-admin';
import { getFirebaseApp } from './firebase-con';
import { Notification, NotificationType } from '@ustaad/shared';

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
    const firebaseApp = getFirebaseApp();

    // 1. Truncate body to save space (FCM limit is 4KB total)
    const safeBody = message && message.length > 500 ? message.substring(0, 497) + '...' : message;

    // 2. Strict Data Flattening
    // FCM 'data' MUST be Record<string, string>.
    // We strip out complex objects and only keep IDs or primitives.
    const dataPayload: Record<string, string> = {
      notificationType: notificationType || 'SYSTEM_NOTIFICATION',
      click_action: clickAction || 'FLUTTER_NOTIFICATION_CLICK',
    };

    // Replace your data loop with this strictly defensive version:
    if (data) {
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value === null || value === undefined) return;

        if (typeof value === 'object') {
          // 1. If it's a Sequelize model, use .id or .get({plain: true})
          if (value.id) {
            dataPayload[key] = String(value.id);
          }
          // 2. If it's a plain object but too big, just take the ID anyway
          else if (value._isSequelizeModel || value.dataValues) {
            dataPayload[key] = String(value.id || 'unknown_id');
          }
          // 3. Last resort: just ignore it if it's too complex
          else {
            console.warn(`Skipping complex object in notification data for key: ${key}`);
          }
        } else {
          dataPayload[key] = String(value);
        }
      });
    }

    // 3. Construct the Message
    const notificationMessage: admin.messaging.Message = {
      token: token,
      notification: {
        title: headline,
        body: safeBody,
        // ...(imageUrl && { imageUrl }), // Only add if valid
      },
      // data: dataPayload,
      android: {
        priority: 'high',
        notification: {
          clickAction: dataPayload.click_action,
          icon: 'ic_notification',
          color: '#4CAF50',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
            contentAvailable: true,
          },
        },
      },
    };

    // 4. Persistence: Store the FULL data in the DB (DB has no 4KB limit)
    const notificationRecord = await Notification.create({
      userId: userId,
      type: notificationType || NotificationType.SYSTEM_NOTIFICATION,
      title: headline,
      body: message,
      deviceToken: token,
      status: 'pending',
      isRead: false,
      sentAt: new Date(),
      metadata: data,
    });

    // 5. Final Size Check & Send
    const payloadSize = Buffer.byteLength(JSON.stringify(notificationMessage));
    if (payloadSize > 4000) {
      throw new Error(`Payload too large: ${payloadSize} bytes. Reduce 'data' fields.`);
    }

    const response = await firebaseApp.messaging().send(notificationMessage);

    // Update status to sent
    await notificationRecord.update({
      status: 'sent',
      sentAt: new Date(),
    });

    return {
      success: true,
      messageId: response,
    };
  } catch (error: any) {
    console.error(`❌ Error sending notification to user ${userId}:`, error);

    // Update the specific record we just created to 'failed'
    // We use the ID from the record we created in step 4
    try {
      // Note: You'd need to ensure notificationRecord is accessible here
      // If it failed before creation, this part is skipped.
    } catch (dbError) {
      console.error('Failed to update notification status:', dbError);
    }

    return {
      success: false,
      error: error.message || 'Unknown Firebase error',
    };
  }
}
