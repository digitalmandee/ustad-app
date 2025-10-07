import { Model, DataTypes, Sequelize, Optional } from "sequelize";

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

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public userId!: string;
  public type!: string;
  public title!: string;
  public body!: string;
  public isRead!: boolean;
  public sentAt!: Date;
  public readAt?: Date;
  public deviceToken?: string;
  public status!: 'pending' | 'sent' | 'failed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initNotificationModel(sequelize: Sequelize): typeof Notification {
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Notification type (e.g., 'booking_confirmation', 'session_reminder')",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deviceToken: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Firebase device token",
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      tableName: "notifications",
      timestamps: true,
    }
  );

  return Notification;
} 