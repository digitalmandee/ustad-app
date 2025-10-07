export interface NotificationPayload {
    token: string;
    headline: string;
    message: string;
    data?: any;
    imageUrl?: string;
    clickAction?: string;
    userId: string;
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
