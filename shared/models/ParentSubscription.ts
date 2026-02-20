import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Parent } from "./Parent";
import { User } from "./User";
import { Offer } from "./Offer";
import { ParentSubscriptionStatus } from "../constant/enums";

export interface ParentSubscriptionAttributes {
  id: string;
  parentId: string;
  tutorId: string;
  offerId: string; // Added offerId
  status: string; // 'active', 'cancelled', 'expired', 'created', 'dispute', 'completed', 'pending_completion'
  planType: string; // 'monthly', 'yearly', etc.
  startDate: Date;
  endDate?: Date;
  amount: number;
  disputeReason?: string;
  disputedBy?: string;
  disputedAt?: Date;
  // PayFast fields
  basketId?: string; // PayFast basket ID
  instrumentToken?: string; // PayFast recurring payment token
  nextBillingDate?: Date; // Next recurring charge date
  lastPaymentDate?: Date; // Last successful payment date
  lastPaymentAmount?: number; // Last payment amount
  failureCount?: number; // Consecutive payment failures
  createdAt?: Date;
  updatedAt?: Date;
  isRefunded?: boolean;
}

export type ParentSubscriptionCreationAttributes = Optional<
  ParentSubscriptionAttributes,
  "id"
>;

export class ParentSubscription
  extends Model<
    ParentSubscriptionAttributes,
    ParentSubscriptionCreationAttributes
  >
  implements ParentSubscriptionAttributes
{
  public id!: string;
  public parentId!: string;
  public tutorId!: string;
  public offerId!: string; // Added offerId
  public status!: string;
  public planType!: string;
  public startDate!: Date;
  public endDate?: Date;
  public amount!: number;
  public disputeReason?: string;
  public disputedBy?: string;
  public disputedAt?: Date;
  // PayFast fields
  public basketId?: string;
  public instrumentToken?: string;
  public nextBillingDate?: Date;
  public lastPaymentDate?: Date;
  public lastPaymentAmount?: number;
  public failureCount?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly isRefunded!: boolean;
}

export function initParentSubscriptionModel(
  sequelize: Sequelize
): typeof ParentSubscription {
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
      offerId: {
        // Added offerId
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "offers",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM(
          ParentSubscriptionStatus.ACTIVE,
          ParentSubscriptionStatus.CANCELLED,
          ParentSubscriptionStatus.EXPIRED,
          ParentSubscriptionStatus.CREATED,
          ParentSubscriptionStatus.DISPUTE,
          ParentSubscriptionStatus.COMPLETED,
          ParentSubscriptionStatus.PENDING_COMPLETION
        ),
        allowNull: false,
        defaultValue: ParentSubscriptionStatus.ACTIVE,
      },
      disputeReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      disputedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      disputedAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
      // PayFast fields
      basketId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "PayFast basket ID for the subscription",
      },
      instrumentToken: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "PayFast recurring payment token",
      },
      nextBillingDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Next recurring payment date",
      },
      lastPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Last successful payment date",
      },
      lastPaymentAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Last successful payment amount",
      },
      failureCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Consecutive payment failures",
      },
      isRefunded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
