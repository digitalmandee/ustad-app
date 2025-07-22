import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Parent } from "./Parent";

export interface SubscriptionAttributes {
  id: string;
  customerId: string;
  status: string; // 'active', 'cancelled', 'expired'
  planType: string; // 'monthly', 'yearly', etc.
  startDate: Date;
  endDate: Date;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SubscriptionCreationAttributes = Optional<SubscriptionAttributes, "id">;

export class Subscription
  extends Model<SubscriptionAttributes, SubscriptionCreationAttributes>
  implements SubscriptionAttributes
{
  public id!: string;
  public customerId!: string;
  public status!: string;
  public planType!: string;
  public startDate!: Date;
  public endDate!: Date;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initSubscriptionModel(sequelize: Sequelize): typeof Subscription {
  Subscription.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "parents",
          key: "customerId",
        },
      },
      status: {
        type: DataTypes.ENUM('active', 'cancelled', 'expired'),
        allowNull: false,
        defaultValue: 'active',
      },
      planType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "subscriptions",
    }
  );

  return Subscription;
} 