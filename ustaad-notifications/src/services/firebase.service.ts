import * as admin from "firebase-admin";
import { Notification } from "../models/Notification";
import { DeviceToken } from "../models/DeviceToken";

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

export interface SendNotificationRequest {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class FirebaseService {
  private firebase: admin.app.App;

  constructor() {
    // Initialize Firebase Admin SDK
    this.firebase = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  async sendNotification(
    token: string,
    notification: NotificationData
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data,
        android: {
          notification: {
            clickAction: notification.clickAction,
            icon: "ic_notification",
            color: "#4CAF50",
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

      const response = await this.firebase.messaging().send(message);
      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  async sendNotificationToUser(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    try {
      // Get user's device tokens
      const deviceTokens = await DeviceToken.findAll({
        where: { userId, isActive: true },
      });

      if (deviceTokens.length === 0) {
        console.log(`No active device tokens found for user: ${userId}`);
        return;
      }

      // Send to all user devices
      const promises = deviceTokens.map(async (deviceToken) => {
        try {
          await this.sendNotification(deviceToken.deviceToken, notification);

          // Update last used timestamp
          await deviceToken.update({ lastUsedAt: new Date() });

          return { success: true, deviceToken: deviceToken.deviceToken };
        } catch (error) {
          console.error(
            `Failed to send to device ${deviceToken.deviceToken}:`,
            error
          );

          // Mark token as inactive if it's invalid
          if (
            error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered"
          ) {
            await deviceToken.update({ isActive: false });
          }

          return {
            success: false,
            deviceToken: deviceToken.deviceToken,
            error,
          };
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error("Error sending notification to user:", error);
      throw error;
    }
  }

  async sendBulkNotifications(
    notifications: SendNotificationRequest[]
  ): Promise<void> {
    try {
      const promises = notifications.map(async (notification) => {
        try {
          await this.sendNotificationToUser(notification.userId, {
            title: notification.title,
            body: notification.body,
            data: notification.data,
          });

          // Save notification to database
          await Notification.create({
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            status: "sent",
          });
        } catch (error) {
          console.error(
            `Failed to send notification to user ${notification.userId}:`,
            error
          );

          // Save failed notification
          await Notification.create({
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            status: "failed",
          });
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      throw error;
    }
  }

  async registerDeviceToken(
    userId: string,
    deviceToken: string,
    deviceType: "android" | "ios" | "web"
  ): Promise<void> {
    try {
      // Check if token already exists
      const existingToken = await DeviceToken.findOne({
        where: { deviceToken },
      });

      if (existingToken) {
        // Update existing token
        await existingToken.update({
          userId,
          deviceType,
          isActive: true,
          lastUsedAt: new Date(),
        });
      } else {
        // Create new token
        await DeviceToken.create({
          userId,
          deviceToken,
          deviceType,
          isActive: true,
        });
      }
    } catch (error) {
      console.error("Error registering device token:", error);
      throw error;
    }
  }

  async unregisterDeviceToken(deviceToken: string): Promise<void> {
    try {
      await DeviceToken.update({ isActive: false }, { where: { deviceToken } });
    } catch (error) {
      console.error("Error unregistering device token:", error);
      throw error;
    }
  }

  async getNotificationHistory(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    try {
      return await Notification.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit,
      });
    } catch (error) {
      console.error("Error getting notification history:", error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { id: notificationId } }
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
}
