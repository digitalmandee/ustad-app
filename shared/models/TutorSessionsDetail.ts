import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { TutorSessionStatus } from "../constant/enums";
import { TutorSessions } from "./TutorSessions";
import { User } from "./User";

export interface TutorSessionsDetailAttributes {
  id?: string;
  tutorId: string;
  parentId: string;
  sessionId: string;
  status: TutorSessionStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TutorSessionsDetailCreationAttributes = Optional<TutorSessionsDetailAttributes, "id">;

export class TutorSessionsDetail
  extends Model<TutorSessionsDetailAttributes, TutorSessionsDetailCreationAttributes>
  implements TutorSessionsDetailAttributes
{
  public id!: string;
  public tutorId!: string;
  public parentId!: string;
  public sessionId!: string;
  public status!: TutorSessionStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorSessionsDetailModel(sequelize: Sequelize): typeof TutorSessionsDetail {
  TutorSessionsDetail.init(
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
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tutorSessions",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(TutorSessionStatus)),
        allowNull: false,
        defaultValue: TutorSessionStatus.CREATED,
      },
    },
    {
      sequelize,
      tableName: "tutorSessionsDetail",
    }
  );

  TutorSessionsDetail.belongsTo(TutorSessions, { foreignKey: "sessionId" });
  TutorSessions.hasMany(TutorSessionsDetail, { foreignKey: "sessionId" });


  TutorSessionsDetail.belongsTo(User, { foreignKey: "tutorId" });
  User.hasMany(TutorSessionsDetail, { foreignKey: "tutorId" });

  TutorSessionsDetail.belongsTo(User, { foreignKey: "parentId" });
  User.hasMany(TutorSessionsDetail, { foreignKey: "parentId" });

  return TutorSessionsDetail;
} 