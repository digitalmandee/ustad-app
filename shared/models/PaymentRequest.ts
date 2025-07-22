import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { PaymentStatus } from "../constant/enums";

export interface PaymentRequestAttributes {
  id: string;
  tutorId: string;
  amount: number;
  status: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentRequestCreationAttributes = Optional<PaymentRequestAttributes, "id">;

export class PaymentRequest
  extends Model<PaymentRequestAttributes, PaymentRequestCreationAttributes>
  implements PaymentRequestAttributes
{
  public id!: string;
  public tutorId!: string;
  public amount!: number;
  public status!: PaymentStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initPaymentRequestModel(sequelize: Sequelize): typeof PaymentRequest {
  PaymentRequest.init(
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
          model: 'users',
          key: 'id',
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(PaymentStatus)),
        defaultValue: PaymentStatus.PENDING,
      },
    },
    {
      sequelize,
      tableName: "paymentRequests",
      timestamps: true,
    }
  );

  return PaymentRequest;
} 