import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";
import { ReportReason, ReportStatus } from "../constant/enums";

export interface UserReportAttributes {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserReportCreationAttributes = Optional<UserReportAttributes, "id" | "status" | "createdAt" | "updatedAt">;

export class UserReport
  extends Model<UserReportAttributes, UserReportCreationAttributes>
  implements UserReportAttributes
{
  public id!: string;
  public reporterId!: string;
  public reportedId!: string;
  public reason!: ReportReason;
  public description!: string;
  public status!: ReportStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initUserReportModel(sequelize: Sequelize): typeof UserReport {
  UserReport.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reporterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      reportedId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      reason: {
        type: DataTypes.ENUM(...Object.values(ReportReason)),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(ReportStatus)),
        allowNull: false,
        defaultValue: ReportStatus.PENDING,
      },
    },
    {
      sequelize,
      tableName: "user_reports",
      timestamps: true,
    }
  );

  UserReport.belongsTo(User, { as: "reporter", foreignKey: "reporterId" });
  UserReport.belongsTo(User, { as: "reported", foreignKey: "reportedId" });
  User.hasMany(UserReport, { as: "reportsMade", foreignKey: "reporterId" });
  User.hasMany(UserReport, { as: "reportsReceived", foreignKey: "reportedId" });

  return UserReport;
}
