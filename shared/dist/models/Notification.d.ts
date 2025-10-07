import { Model, Sequelize, Optional } from "sequelize";
export interface NotificationAttributes {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    sentAt: Date;
    readAt?: Date;
    deviceToken?: string;
    status: 'pending' | 'sent' | 'failed';
    createdAt?: Date;
    updatedAt?: Date;
}
export type NotificationCreationAttributes = Optional<NotificationAttributes, "id">;
export declare class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    sentAt: Date;
    readAt?: Date;
    deviceToken?: string;
    status: 'pending' | 'sent' | 'failed';
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initNotificationModel(sequelize: Sequelize): typeof Notification;
