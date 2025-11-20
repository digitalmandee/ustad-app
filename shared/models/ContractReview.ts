import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";
import { ParentSubscription } from "./ParentSubscription";

export interface ContractReviewAttributes {
  id: string;
  contractId: string;
  reviewerId: string;
  reviewedId: string;
  reviewerRole: 'PARENT' | 'TUTOR';
  rating: number;
  review?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ContractReviewCreationAttributes = Optional<ContractReviewAttributes, "id">;

export class ContractReview
  extends Model<ContractReviewAttributes, ContractReviewCreationAttributes>
  implements ContractReviewAttributes
{
  public id!: string;
  public contractId!: string;
  public reviewerId!: string;
  public reviewedId!: string;
  public reviewerRole!: 'PARENT' | 'TUTOR';
  public rating!: number;
  public review?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initContractReviewModel(sequelize: Sequelize): typeof ContractReview {
  ContractReview.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      contractId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "parent_subscriptions",
          key: "id",
        },
      },
      reviewerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      reviewedId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      reviewerRole: {
        type: DataTypes.ENUM('PARENT', 'TUTOR'),
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      review: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "contractReviews",
    }
  );

  ContractReview.belongsTo(ParentSubscription, { foreignKey: "contractId" });
  ParentSubscription.hasMany(ContractReview, { foreignKey: "contractId" });

  ContractReview.belongsTo(User, { foreignKey: "reviewerId", as: "reviewer" });
  ContractReview.belongsTo(User, { foreignKey: "reviewedId", as: "reviewed" });

  return ContractReview;
}

