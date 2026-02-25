import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { OfferStatus } from "../constant/enums";
import { Conversation } from "./Conversation";
import { User } from "./User";
import { Message } from "./Message";

interface OfferAttributes {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  messageId: string;
  childName: string;
  amountMonthly: number;
  subject: string[];
  startDate: Date;
  startTime: string;
  endTime: string;
  description?: string;
  status: OfferStatus;
  daysOfWeek: string[];
  sessions: number;
  isRefunded: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OfferCreationAttributes
  extends Optional<
    OfferAttributes,
    "id" | "description" | "status" | "createdAt" | "updatedAt"
  > {}

export class Offer
  extends Model<OfferAttributes, OfferCreationAttributes>
  implements OfferAttributes
{
  public id!: string;
  public conversationId!: string;
  public senderId!: string;
  public receiverId!: string;
  public messageId!: string;
  public childName!: string;
  public amountMonthly!: number;
  public subject!: string[];
  public startDate!: Date;
  public startTime!: string;
  public endTime!: string;
  public sessions!: number;
  public description!: string;
  public status!: OfferStatus;
  public daysOfWeek!: string[];
  public isRefunded!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initOfferModel(sequelize: Sequelize): typeof Offer {
  Offer.init(
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
        onDelete: "CASCADE",
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      receiverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      messageId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "messages",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      childName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amountMonthly: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      subject: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      sessions: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "ACCEPTED",
          "REJECTED",
          "CANCELLED",
          "COMPLETED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
      },
      isRefunded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      daysOfWeek: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "offers",
      timestamps: true,
    }
  );

  // Associations
  Offer.belongsTo(Conversation, {
    foreignKey: "conversationId",
    as: "conversation",
  });
  Offer.belongsTo(User, { foreignKey: "senderId", as: "sender" });
  Offer.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });
  Offer.belongsTo(Message, { foreignKey: "messageId", as: "message" });

  Message.hasOne(Offer, { foreignKey: "messageId", as: "offer" });

  return Offer;
}
