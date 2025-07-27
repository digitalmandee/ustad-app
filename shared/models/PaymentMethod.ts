import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Parent } from "./Parent";
import { User } from "./User";

export interface PaymentMethodAttributes {
  id: string;
  parentId: string;
  stripePaymentMethodId: string;
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: number;
  cardExpYear: number;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentMethodCreationAttributes = Optional<
  PaymentMethodAttributes,
  "id"
>;

export class PaymentMethod
  extends Model<PaymentMethodAttributes, PaymentMethodCreationAttributes>
  implements PaymentMethodAttributes
{
  public id!: string;
  public parentId!: string;
  public stripePaymentMethodId!: string;
  public cardBrand!: string;
  public cardLast4!: string;
  public cardExpMonth!: number;
  public cardExpYear!: number;
  public isDefault!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initPaymentMethodModel(
  sequelize: Sequelize
): typeof PaymentMethod {
  PaymentMethod.init(
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
      stripePaymentMethodId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      cardBrand: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cardLast4: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cardExpMonth: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cardExpYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: "payment_methods",
    }
  );

  PaymentMethod.belongsTo(User, { foreignKey: "parentId" });
  User.hasMany(PaymentMethod, { foreignKey: "parentId" });

  return PaymentMethod;
}
