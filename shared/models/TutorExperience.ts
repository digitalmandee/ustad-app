import { Model, DataTypes, Sequelize } from "sequelize";
import { Tutor } from "./Tutor";

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
          model: "tutors",
          key: "userId",
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

  TutorExperience.belongsTo(Tutor, { foreignKey: "tutorId" });
  Tutor.hasMany(TutorExperience, { foreignKey: "tutorId" });

  return TutorExperience;
} 