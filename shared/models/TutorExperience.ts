import { Model, DataTypes, Sequelize } from "sequelize";
import { Tutor } from "./Tutor";
import { User } from "./User";

export interface TutorExperienceAttributes {
  id: number;
  tutorId: string;
  company: string;
  startDate: Date;
  endDate: Date;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TutorExperience extends Model<TutorExperienceAttributes> {
  public id!: number;
  public tutorId!: string;
  public company!: string;
  public startDate!: Date;
  public endDate!: Date;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorExperienceModel(sequelize: Sequelize): typeof TutorExperience {
  TutorExperience.init(
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
      company: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "tutor_experiences",
    }
  );

  TutorExperience.belongsTo(User, { foreignKey: "tutorId" });
  User.hasMany(TutorExperience, { foreignKey: "tutorId" });

  return TutorExperience;
} 