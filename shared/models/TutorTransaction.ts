import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";
import { ParentSubscription } from "./ParentSubscription";
import { TutorPaymentStatus } from "../constant/enums";

export interface TutorTransactionAttributes {
  id: string;
  tutorId: string;
  subscriptionId: string;
  status: TutorPaymentStatus;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TutorTransactionCreationAttributes = Optional<
  TutorTransactionAttributes,
  "id"
>;

export class TutorTransaction
  extends Model<
    TutorTransactionAttributes,
    TutorTransactionCreationAttributes
  >
  implements TutorTransactionAttributes
{
  public id!: string;
  public tutorId!: string;
  public subscriptionId!: string;
  public status!: TutorPaymentStatus;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorTransactionModel(
  sequelize: Sequelize
): typeof TutorTransaction {
  TutorTransaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tutorId: {
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
        type: DataTypes.ENUM(...Object.values(TutorPaymentStatus)),
        allowNull: false,
        defaultValue: TutorPaymentStatus.PENDING,
      },
    },
    {
      sequelize,
      tableName: "tutor_transactions",
    }
  );

  // Define associations
  TutorTransaction.belongsTo(User, { foreignKey: "tutorId" });
  User.hasMany(TutorTransaction, { foreignKey: "tutorId" });

  TutorTransaction.belongsTo(ParentSubscription, {
    foreignKey: "subscriptionId",
  });
  ParentSubscription.hasMany(TutorTransaction, {
    foreignKey: "subscriptionId",
  });

  return TutorTransaction;
}
