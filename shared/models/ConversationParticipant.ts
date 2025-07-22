import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { User } from './User';
import { Conversation } from './Conversation';

export interface ConversationParticipantAttributes {
  id: string;
  conversationId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  lastReadAt?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ConversationParticipantCreationAttributes = Optional<
  ConversationParticipantAttributes,
  'id' | 'role' | 'lastReadAt' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes> 
  implements ConversationParticipantAttributes {
  public id!: string;
  public conversationId!: string;
  public userId!: string;
  public role!: string;
  public joinedAt!: Date;
  public lastReadAt!: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initConversationParticipantModel(sequelize: Sequelize): typeof ConversationParticipant {
  ConversationParticipant.init(
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
          model: 'conversations',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'member',
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      lastReadAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      sequelize,
      tableName: 'conversation_participants',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'conversationId'],
        },
      ],
    }
  );

  Conversation.hasMany(ConversationParticipant, {
    foreignKey: 'conversationId',
    as: 'participants',
  });

  ConversationParticipant.belongsTo(Conversation, {
    foreignKey: 'conversationId',
    as: 'conversation', 
  });

  ConversationParticipant.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(ConversationParticipant, { foreignKey: 'userId' });

  return ConversationParticipant;
} 