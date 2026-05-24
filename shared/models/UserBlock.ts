import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";

export interface UserBlockAttributes {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserBlockCreationAttributes = Optional<UserBlockAttributes, "id" | "createdAt" | "updatedAt">;

export class UserBlock
  extends Model<UserBlockAttributes, UserBlockCreationAttributes>
  implements UserBlockAttributes
{
  public id!: string;
  public blockerId!: string;
  public blockedId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initUserBlockModel(sequelize: Sequelize): typeof UserBlock {
  UserBlock.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      blockerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      blockedId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      tableName: "user_blocks",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["blockerId", "blockedId"],
        },
      ],
    }
  );

  UserBlock.belongsTo(User, { as: "blocker", foreignKey: "blockerId" });
  UserBlock.belongsTo(User, { as: "blocked", foreignKey: "blockedId" });
  User.hasMany(UserBlock, { as: "blocksMade", foreignKey: "blockerId" });
  User.hasMany(UserBlock, { as: "blocksReceived", foreignKey: "blockedId" });

  return UserBlock;
}
