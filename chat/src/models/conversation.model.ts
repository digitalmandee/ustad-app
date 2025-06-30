import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { ConversationType, ConversationStatus } from '../constant/enums';

interface ConversationAttributes {
  id: string;
  name?: string;
  description?: string;
  type: ConversationType;
  status: ConversationStatus;
  createdBy: string;
  lastMessageAt?: Date;
  isPrivate: boolean;
  maxParticipants?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationCreationAttributes
  extends Optional<
    ConversationAttributes,
    'id' | 'name' | 'description' | 'status' | 'lastMessageAt' | 'isPrivate' | 'maxParticipants' | 'createdAt' | 'updatedAt'
  > {}

export class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> 
  implements ConversationAttributes {
  public id!: string;
  public name!: string;
  public description!: string;
  public type!: ConversationType;
  public status!: ConversationStatus;
  public createdBy!: string;
  public lastMessageAt!: Date;
  public isPrivate!: boolean;
  public maxParticipants!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initConversationModel(sequelize: Sequelize): typeof Conversation {
  Conversation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(...Object.values(ConversationType)),
        allowNull: false,
        defaultValue: ConversationType.DIRECT,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(ConversationStatus)),
        allowNull: false,
        defaultValue: ConversationStatus.ACTIVE,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      maxParticipants: {
        type: DataTypes.INTEGER,
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
      tableName: 'conversations',
      sequelize,
      timestamps: true,
    }
  );

  return Conversation;
}