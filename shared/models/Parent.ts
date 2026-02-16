import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";

export interface TutorAttributes {
  id: string;
  userId: string;
  idFrontUrl: string;
  idBackUrl: string;
  customerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  accountNumber?: string;
  bankName?: string;
  balance?: string;
}

export type TutorCreationAttributes = Optional<TutorAttributes, "id">;

export class Parent
  extends Model<TutorAttributes, TutorCreationAttributes>
  implements TutorAttributes
{
  public id!: string;
  public userId!: string;
  public idFrontUrl!: string;
  public idBackUrl!: string;
  public customerId?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public accountNumber!: string;
  public bankName!: string;
  public balance!: string;
}

export function initParentModel(sequelize: Sequelize): typeof Parent {
  Parent.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      idFrontUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      idBackUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accountNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      balance: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "parents",
    }
  );

  Parent.belongsTo(User, { foreignKey: "userId" });
  User.hasOne(Parent, { foreignKey: "userId" });

  return Parent;
}
