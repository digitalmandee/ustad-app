import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { User } from './User';
import { Conversation } from './Conversation';
export interface FileAttributes {
  id: string; // uuid
  conversationId: string;
  userId: string; // who uploaded it
  filename: string; // stored filename
  originalName: string; // original filename from user
  mimetype: string;
  size: number;
  url: string; // /messages/file/:filename
  status: 'active' | 'deleted' | 'expired';
  thumbnailUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FileCreationAttributes = Optional<
  FileAttributes,
  'id' | 'status' | 'thumbnailUrl' | 'expiresAt' | 'metadata' | 'createdAt' | 'updatedAt'
>;

export class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  public id!: string;
  public conversationId!: string;
  public userId!: string;
  public filename!: string;
  public originalName!: string;
  public mimetype!: string;
  public size!: number;
  public url!: string;
  public status!: 'active' | 'deleted' | 'expired';
  public thumbnailUrl?: string | undefined;
  public expiresAt?: Date | undefined;
  public metadata?: Record<string, any> | undefined;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initFileModel(sequelize: Sequelize): typeof File {
  File.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mimetype: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.BIGINT, // allows very large file sizes
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'deleted', 'expired'),
        allowNull: false,
        defaultValue: 'active',
      },
      thumbnailUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB, // flexible for extra info
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
      tableName: 'files',
      sequelize,
      timestamps: true,
      indexes: [
        { fields: ['conversationId'] },
        { fields: ['userId'] },
        { fields: ['status'] },
      ],
    }
  );

  // User -> File
User.hasMany(File, {
  foreignKey: "userId",
  onDelete: "CASCADE",   // delete all files when user is deleted
});
File.belongsTo(User, { foreignKey: "userId" });

// Conversation -> File
Conversation.hasMany(File, {
  foreignKey: "conversationId",
  onDelete: "CASCADE",   // delete all files when conversation is deleted
});
File.belongsTo(Conversation, { foreignKey: "conversationId" });

  return File;
}
