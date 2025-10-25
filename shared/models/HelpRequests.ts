import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";
import { HelpRequestStatus, UserRole, HelpRequestType } from "../constant/enums";

export interface HelpRequestsAttributes {
  id: string;
  requesterId: string;
  againstId?: string;
  subject: string;
  status: HelpRequestStatus;
  message?: string;
  requester: UserRole;
  type?: HelpRequestType;
  data?: JSON;
  createdAt?: Date;
  updatedAt?: Date;
}

export class HelpRequests
  extends Model<HelpRequestsAttributes>
  implements HelpRequestsAttributes
{
  public id!: string;
  public requesterId!: string;
  public againstId?:string;
  public subject!: string;
  public status!: HelpRequestStatus;
  public message?: string;
  public requester!: UserRole;
  public type?: HelpRequestType;
  public data?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initHelpRequestsModel(
  sequelize: Sequelize
): typeof HelpRequests {
  HelpRequests.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      requesterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      againstId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      requester: {
        type: DataTypes.ENUM(...Object.values(UserRole)),
        allowNull: false,
      },
      subject: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(HelpRequestStatus)),
        allowNull: false,
        defaultValue: HelpRequestStatus.OPEN,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(...Object.values(HelpRequestType)),
        allowNull: false,
        defaultValue: HelpRequestType.GENERAL,
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "help_requests",
      timestamps: true,
    }
  );

  return HelpRequests;
}
