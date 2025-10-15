import { Notification } from "./models";
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
export declare function sendNotification(userId: string, token: string, headline: string, message: string, data?: any, imageUrl?: string, clickAction?: string): Promise<NotificationResult>;
/**
 * Send notifications to multiple device tokens
 * @param notifications - Array of notification payloads
 * @returns Promise<NotificationResult[]>
 */
export declare function sendBulkNotifications(notifications: NotificationPayload[]): Promise<NotificationResult[]>;
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
export declare function sendNotificationToMultipleTokens(tokens: string[], headline: string, message: string, data?: Record<string, string>, imageUrl?: string, clickAction?: string): Promise<NotificationResult[]>;
/**
 * Validate if a Firebase token is valid
 * @param token - Firebase device token to validate
 * @returns Promise<boolean>
 */
export declare function validateFirebaseToken(token: string): Promise<boolean>;
/**
 * Send notification to a user with enhanced metadata
 * @param params - Notification parameters including user ID, type, title, body, etc.
 * @returns Promise<NotificationResult>
 */
export declare function sendNotificationToUser(params: SendNotificationParams): Promise<NotificationResult>;
/**
 * Send notification to multiple users
 * @param userIds - Array of user IDs
 * @param params - Notification parameters (without userId)
 * @returns Promise<NotificationResult[]>
 */
export declare function sendNotificationToUsers(userIds: string[], params: Omit<SendNotificationParams, "userId">): Promise<NotificationResult[]>;
/**
 * Get user notifications with pagination
 * @param userId - User ID
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Promise with notifications and pagination info
 */
export declare function getUserNotifications(userId: string, page?: number, limit?: number): Promise<{
    notifications: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
/**
 * Mark notification as read
 * @param notificationId - Notification ID
 * @param userId - User ID (for security check)
 * @returns Promise<boolean>
 */
export declare function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean>;
/**
 * Mark all notifications as read for a user
 * @param userId - User ID
 * @returns Promise<number> - Number of notifications updated
 */
export declare function markAllNotificationsAsRead(userId: string): Promise<number>;
/**
 * Get unread notification count for a user
 * @param userId - User ID
 * @returns Promise<number>
 */
export declare function getUnreadNotificationCount(userId: string): Promise<number>;
