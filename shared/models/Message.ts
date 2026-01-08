import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { MessageType, MessageStatus } from "../constant/enums";
import { User } from "./User";

export interface MessageAttributes {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  replyToId?: string;
  editedAt?: Date;
  metadata?: object;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MessageCreationAttributes = Optional<
  MessageAttributes,
  | "id"
  | "status"
  | "replyToId"
  | "editedAt"
  | "metadata"
  | "createdAt"
  | "updatedAt"
>;

export class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: string;
  public conversationId!: string;
  public senderId!: string;
  public content!: string;
  public type!: MessageType;
  public status!: MessageStatus;
  public replyToId!: string;
  public editedAt!: Date;
  public metadata!: object;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initMessageModel(sequelize: Sequelize): typeof Message {
  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "conversations",
          key: "id",
        },
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(...Object.values(MessageType)),
        allowNull: false,
        defaultValue: MessageType.TEXT,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(MessageStatus)),
        allowNull: false,
        defaultValue: MessageStatus.SENT,
      },
      replyToId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "messages",
          key: "id",
        },
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "messages",
      sequelize,
      timestamps: true,
    }
  );

  Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });

  return Message;
}
