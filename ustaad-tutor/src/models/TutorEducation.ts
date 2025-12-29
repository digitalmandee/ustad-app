import { Model, DataTypes, Sequelize } from "sequelize";
import { Tutor } from "./Tutor";

export interface TutorEducationAttributes {
  id: number;
  tutorId: string;
  institute: string;
  startDate: Date;
  endDate: Date;
  description: string;
  degreeUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TutorEducation extends Model<TutorEducationAttributes> {
  public id!: number;
  public tutorId!: string;
  public institute!: string;
  public startDate!: Date;
  public endDate!: Date;
  public description!: string;
  public degreeUrl?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorEducationModel(sequelize: Sequelize): typeof TutorEducation {
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
          model: "tutors",
          key: "userId",
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
        type: DataTypes.DATE,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      degreeUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "tutor_educations",
    }
  );

  TutorEducation.belongsTo(Tutor, { foreignKey: "tutorId" });
  Tutor.hasMany(TutorEducation, { foreignKey: "tutorId" });

  return TutorEducation;
} 