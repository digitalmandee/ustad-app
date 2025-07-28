import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Tutor } from "./Tutor";
import { User } from "./User";

export interface SubjectCostSetting {
  cost: number;
  active: boolean;
}

export interface TutorSettingsAttributes {
  id: string;
  tutorId: string;
  minSubjects: number;
  maxStudentsDaily: number;
  subjectCosts: Record<string, SubjectCostSetting>; // subjectId or name to cost+active
  createdAt?: Date;
  updatedAt?: Date;
}

export type TutorSettingsCreationAttributes = Optional<TutorSettingsAttributes, "id">;

export class TutorSettings extends Model<TutorSettingsAttributes, TutorSettingsCreationAttributes> implements TutorSettingsAttributes {
  public id!: string;
  public tutorId!: string;
  public minSubjects!: number;
  public maxStudentsDaily!: number;
  public subjectCosts!: Record<string, SubjectCostSetting>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorSettingsModel(sequelize: Sequelize): typeof TutorSettings {
  TutorSettings.init(
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
        unique: true,
      },
      minSubjects: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      maxStudentsDaily: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subjectCosts: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      sequelize,
      tableName: "tutor_settings",
    }
  );

  TutorSettings.belongsTo(User, { foreignKey: "tutorId" });
  User.hasOne(TutorSettings, { foreignKey: "tutorId" });

  return TutorSettings;
} 