import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";

export interface ChildAttributes {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  gender: string;
  grade: string;
  age: number;
  schoolName: string;
  curriculum: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ChildCreationAttributes = Optional<ChildAttributes, "id">;

export class Child
  extends Model<ChildAttributes, ChildCreationAttributes>
  implements ChildAttributes
{
  public id!: string;
  public userId!: string;
  public firstName!: string;
  public lastName!: string;
  public gender!: string;
  public grade!: string;
  public age!: number;
  public schoolName!: string;
  public curriculum!: string;
  public image?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initChildModel(sequelize: Sequelize): typeof Child {
  Child.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      grade: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      schoolName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      curriculum: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "children",
    }
  );

  Child.belongsTo(User, { foreignKey: "userId" });
  User.hasMany(Child, { foreignKey: "userId" });

  return Child;
}
