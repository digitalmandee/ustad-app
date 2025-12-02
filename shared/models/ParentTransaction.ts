import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";
import { ParentSubscription } from "./ParentSubscription";

export interface ParentTransactionAttributes {
  id: string;
  parentId: string;
  subscriptionId: string;
  invoiceId: string;
  status: string;
  amount: number;
  childName: string;
  // PayFast fields
  basketId?: string; // PayFast basket ID
  orderStatus?: string; // PENDING, SUCCESS, FAILED
  createdAt?: Date;
  updatedAt?: Date;
}

export type ParentTransactionCreationAttributes = Optional<
  ParentTransactionAttributes,
  "id"
>;

export class ParentTransaction
  extends Model<
    ParentTransactionAttributes,
    ParentTransactionCreationAttributes
  >
  implements ParentTransactionAttributes
{
  public id!: string;
  public parentId!: string;
  public subscriptionId!: string;
  public invoiceId!: string;
  public status!: string;
  public amount!: number;
  public childName!: string;
  // PayFast fields
  public basketId?: string;
  public orderStatus?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initParentTransactionModel(
  sequelize: Sequelize
): typeof ParentTransaction {
  ParentTransaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "parent_subscriptions",
          key: "id",
        },
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "created",
      },
      invoiceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      childName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // PayFast fields
      basketId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      orderStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "PENDING",
        validate: {
          isIn: [["PENDING", "SUCCESS", "FAILED"]],
        },
      },
    },
    {
      sequelize,
      tableName: "parent_transactions",
    }
  );

  // Define associations
  ParentTransaction.belongsTo(User, { foreignKey: "parentId" });
  User.hasMany(ParentTransaction, { foreignKey: "parentId" });

  ParentTransaction.belongsTo(ParentSubscription, {
    foreignKey: "subscriptionId",
  });
  ParentSubscription.hasMany(ParentTransaction, {
    foreignKey: "subscriptionId",
  });

  return ParentTransaction;
}
