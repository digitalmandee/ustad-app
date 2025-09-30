"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.sendBulkNotifications = sendBulkNotifications;
exports.sendNotificationToMultipleTokens = sendNotificationToMultipleTokens;
exports.validateFirebaseToken = validateFirebaseToken;
const firebase_con_1 = require("./firebase-con");
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
async function sendNotification(token, headline, message, data, imageUrl, clickAction) {
    try {
        const firebaseApp = (0, firebase_con_1.getFirebaseApp)();
        const notificationMessage = {
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
    }
    catch (error) {
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
async function sendBulkNotifications(notifications) {
    const promises = notifications.map(async (notification) => {
        return await sendNotification(notification.token, notification.headline, notification.message, notification.data, notification.imageUrl, notification.clickAction);
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
async function sendNotificationToMultipleTokens(tokens, headline, message, data, imageUrl, clickAction) {
    try {
        const firebaseApp = (0, firebase_con_1.getFirebaseApp)();
        const notificationMessage = {
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
    }
    catch (error) {
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
async function validateFirebaseToken(token) {
    try {
        const firebaseApp = (0, firebase_con_1.getFirebaseApp)();
        // Try to send a dry-run message to validate the token
        await firebaseApp.messaging().send({
            token,
            notification: {
                title: "Test",
                body: "Test",
            },
        }, true); // dry-run mode
        return true;
    }
    catch (error) {
        console.error("❌ Token validation failed:", error.message);
        return false;
    }
}
// Types are already exported above with the interface declarations
