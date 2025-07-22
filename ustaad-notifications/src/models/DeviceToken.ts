import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export interface DeviceTokenAttributes {
  id: string;
  userId: string;
  deviceToken: string;
  deviceType: 'android' | 'ios' | 'web';
  isActive: boolean;
  lastUsedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DeviceTokenCreationAttributes = Optional<DeviceTokenAttributes, "id">;

export class DeviceToken
  extends Model<DeviceTokenAttributes, DeviceTokenCreationAttributes>
  implements DeviceTokenAttributes
{
  public id!: string;
  public userId!: string;
  public deviceToken!: string;
  public deviceType!: 'android' | 'ios' | 'web';
  public isActive!: boolean;
  public lastUsedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initDeviceTokenModel(sequelize: Sequelize): typeof DeviceToken {
  DeviceToken.init(
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
      deviceToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      deviceType: {
        type: DataTypes.ENUM('android', 'ios', 'web'),
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "deviceTokens",
      timestamps: true,
    }
  );

  return DeviceToken;
} 