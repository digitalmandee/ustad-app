import { Model, DataTypes, Sequelize, Optional } from "sequelize";
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

export type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  "id"
>;

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public userId!: string;
  public type!: NotificationType;
  public title!: string;
  public body!: string;
  public isRead!: boolean;
  public sentAt!: Date;
  public readAt?: Date;
  public deviceToken?: string;
  public status!: "pending" | "sent" | "failed";
  public relatedEntityId?: string;
  public relatedEntityType?: string;
  public actionUrl?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initNotificationModel(
  sequelize: Sequelize
): typeof Notification {
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
        comment: "Notification type",
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
        type: DataTypes.ENUM("pending", "sent", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      relatedEntityId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "ID of related entity (offer, message, session, etc.)",
      },
      relatedEntityType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment:
          "Type of related entity (offer, message, session, review, etc.)",
      },
      actionUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Deep link URL to navigate to when notification is clicked",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Additional metadata for the notification",
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
