import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Parent } from "./Parent";
import { User } from "./User";
import { Offer } from "./Offer";

export interface ParentSubscriptionAttributes {
  id: string;
  parentId: string;
  tutorId: string;
  offerId: string; // Added offerId
  stripeSubscriptionId: string;
  status: string; // 'active', 'cancelled', 'expired'
  planType: string; // 'monthly', 'yearly', etc.
  startDate: Date;
  endDate?: Date;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ParentSubscriptionCreationAttributes = Optional<ParentSubscriptionAttributes, "id">;

export class ParentSubscription
  extends Model<ParentSubscriptionAttributes, ParentSubscriptionCreationAttributes>
  implements ParentSubscriptionAttributes
{
  public id!: string;
  public parentId!: string;
  public tutorId!: string;
  public offerId!: string; // Added offerId
  public stripeSubscriptionId!: string;
  public status!: string;
  public planType!: string;
  public startDate!: Date;
  public endDate?: Date;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date; 
}

export function initParentSubscriptionModel(sequelize: Sequelize): typeof ParentSubscription {
  ParentSubscription.init(
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
      tutorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      offerId: { // Added offerId
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "offers",
          key: "id",
        },
      },
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'cancelled', 'expired', 'created'),
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
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "parent_subscriptions",
    }
  );

    ParentSubscription.belongsTo(Offer, { foreignKey: "offerId" });
    Offer.hasMany(ParentSubscription, { foreignKey: "offerId" });

    ParentSubscription.belongsTo(User, { foreignKey: "parentId" });
    User.hasMany(ParentSubscription, { foreignKey: "parentId" });

    ParentSubscription.belongsTo(User, { foreignKey: "tutorId" });
    User.hasMany(ParentSubscription, { foreignKey: "tutorId" });

  return ParentSubscription;
}