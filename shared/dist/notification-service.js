"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.sendBulkNotifications = sendBulkNotifications;
exports.sendNotificationToMultipleTokens = sendNotificationToMultipleTokens;
exports.validateFirebaseToken = validateFirebaseToken;
exports.sendNotificationToUser = sendNotificationToUser;
exports.sendNotificationToUsers = sendNotificationToUsers;
exports.getUserNotifications = getUserNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
const firebase_con_1 = require("./firebase-con");
const models_1 = require("./models");
const enums_1 = require("./constant/enums");
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
async function sendNotification(userId, token, headline, message, data, imageUrl, clickAction) {
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
        const notification = await models_1.Notification.create({
            userId: userId,
            type: enums_1.NotificationType.SYSTEM_NOTIFICATION,
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
        const response = await firebaseApp
            .messaging()
            .sendEachForMulticast(notificationMessage);
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
/**
 * Send notification to a user with enhanced metadata
 * @param params - Notification parameters including user ID, type, title, body, etc.
 * @returns Promise<NotificationResult>
 */
async function sendNotificationToUser(params) {
    const { userId, type, title, body, relatedEntityId, relatedEntityType, actionUrl, metadata, } = params;
    try {
        // Get user's device token
        const user = await models_1.User.findByPk(userId);
        if (!user || !user.deviceId) {
            console.log(`⚠️ User ${userId} has no device token`);
            // Still create notification in DB for in-app viewing
            await models_1.Notification.create({
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
        const notification = await models_1.Notification.create({
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
        const dataPayload = {
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
        const result = await sendNotification(userId, user.deviceId, title, body, dataPayload, undefined, // imageUrl
        actionUrl);
        // Update notification status
        if (result.success) {
            await notification.update({ status: "sent", sentAt: new Date() });
        }
        else {
            await notification.update({ status: "failed" });
        }
        return result;
    }
    catch (error) {
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
async function sendNotificationToUsers(userIds, params) {
    return Promise.all(userIds.map((userId) => sendNotificationToUser({ ...params, userId })));
}
/**
 * Get user notifications with pagination
 * @param userId - User ID
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Promise with notifications and pagination info
 */
async function getUserNotifications(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { count, rows } = await models_1.Notification.findAndCountAll({
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
async function markNotificationAsRead(notificationId, userId) {
    try {
        const notification = await models_1.Notification.findOne({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            return false;
        }
        await notification.update({ isRead: true, readAt: new Date() });
        return true;
    }
    catch (error) {
        console.error("❌ Error marking notification as read:", error);
        return false;
    }
}
/**
 * Mark all notifications as read for a user
 * @param userId - User ID
 * @returns Promise<number> - Number of notifications updated
 */
async function markAllNotificationsAsRead(userId) {
    try {
        const [updateCount] = await models_1.Notification.update({ isRead: true, readAt: new Date() }, { where: { userId, isRead: false } });
        return updateCount;
    }
    catch (error) {
        console.error("❌ Error marking all notifications as read:", error);
        return 0;
    }
}
/**
 * Get unread notification count for a user
 * @param userId - User ID
 * @returns Promise<number>
 */
async function getUnreadNotificationCount(userId) {
    try {
        return await models_1.Notification.count({
            where: { userId, isRead: false },
        });
    }
    catch (error) {
        console.error("❌ Error getting unread notification count:", error);
        return 0;
    }
}
// Types are already exported above with the interface declarations
