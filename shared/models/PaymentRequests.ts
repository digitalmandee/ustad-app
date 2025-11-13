import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";
import { ParentSubscription } from "./ParentSubscription";
import { TutorPaymentStatus, TutorTransactionType } from "../constant/enums";
import { TutorTransaction, TutorTransactionAttributes, TutorTransactionCreationAttributes } from "./TutorTransaction";

export interface PaymentRequestsAttributes {
  id: string;
  tutorId: string;
  status: TutorPaymentStatus;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentRequestsCreationAttributes = Optional<
  PaymentRequestsAttributes,
  "id"
>;

export class PaymentRequests
  extends Model<
    PaymentRequestsAttributes,
    PaymentRequestsCreationAttributes
  >
  implements PaymentRequestsAttributes
{
  public id!: string;
  public tutorId!: string;
  public status!: TutorPaymentStatus;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initPaymentRequestsModel(
  sequelize: Sequelize
): typeof PaymentRequests {
  PaymentRequests.init(
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
      tableName: "payment_requests",
    }
  );

  // Define associations
  PaymentRequests.belongsTo(User, { foreignKey: "tutorId" });
  User.hasMany(PaymentRequests, { foreignKey: "tutorId" });

  return PaymentRequests;
}
