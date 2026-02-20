import { Model, Sequelize, Optional } from "sequelize";
import { NotificationType } from "../constant/enums";
export interface NotificationAttributes {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    sentAt: Date;
    readAt?: Date;
    deviceToken?: string;
    status: "pending" | "sent" | "failed";
    relatedEntityId?: string;
    relatedEntityType?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
export type NotificationCreationAttributes = Optional<NotificationAttributes, "id">;
export declare class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    sentAt: Date;
    readAt?: Date;
    deviceToken?: string;
    status: "pending" | "sent" | "failed";
    relatedEntityId?: string;
    relatedEntityType?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initNotificationModel(sequelize: Sequelize): typeof Notification;
