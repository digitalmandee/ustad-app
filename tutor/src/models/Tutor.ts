import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";


export interface TutorAttributes {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  upiId?: string;
  resumeUrl: string;
  idFrontUrl: string;
  idBackUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TutorCreationAttributes = Optional<TutorAttributes, "id">;

export class Tutor
  extends Model<TutorAttributes, TutorCreationAttributes>
  implements TutorAttributes
{
  public id!: string;
  public userId!: string;
  public bankName!: string;
  public accountNumber!: string;
  public resumeUrl: string;
  public idFrontUrl: string;
  public idBackUrl: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorModel(sequelize: Sequelize): typeof Tutor {
  Tutor.init(
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
      bankName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      resumeUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      idFrontUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      idBackUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "tutors",
    }
  );

  Tutor.belongsTo(User, { foreignKey: "userId" });
  User.hasOne(Tutor, { foreignKey: "userId" });

  return Tutor;
}
