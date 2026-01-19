import { Model, DataTypes, Sequelize } from "sequelize";
import { Tutor } from "./Tutor";
import { User } from "./User";

export interface TutorEducationAttributes {
  id: number;
  tutorId: string;
  institute: string;
  startDate: Date;
  endDate?: Date | string | null;
  description: string;
  degree?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TutorEducation extends Model<TutorEducationAttributes> {
  public id!: number;
  public tutorId!: string;
  public institute!: string;
  public startDate!: Date;
  public endDate?: Date | string | null;
  public description!: string;
  public degree?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorEducationModel(
  sequelize: Sequelize
): typeof TutorEducation {
  TutorEducation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
      institute: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      degree: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "tutor_educations",
    }
  );

  TutorEducation.belongsTo(User, { foreignKey: "tutorId" });
  User.hasMany(TutorEducation, { foreignKey: "tutorId" });

  return TutorEducation;
}
