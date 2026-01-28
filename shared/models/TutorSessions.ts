import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Tutor } from "./Tutor";
import { Parent } from "./Parent";
import { User } from "./User";
import { Offer } from "./Offer";

export interface TutorSessionsAttributes {
  id: string;
  tutorId: string;
  parentId: string;
  childName: string;
  startTime: string;
  offerId?: string; // Made optional to match nullable field
  endTime?: string;
  daysOfWeek: string[]; // Array of days like ["mon", "tue", "fri"] or ["mon-fri"]
  price: number; // Price per session in cents (e.g., 2500 for $25.00)
  meta?: object;
  status: "active" | "cancelled" | "paused" | "completed";
  createdAt?: Date;
  updatedAt?: Date;
  month: string; // yyyy-mm-dd format
  totalSessions: number;
  sessionsCompleted: number; // yyyy-mm-dd format
}

export type TutorSessionsCreationAttributes = Optional<
  TutorSessionsAttributes,
  "id"
>;

export class TutorSessions
  extends Model<TutorSessionsAttributes, TutorSessionsCreationAttributes>
  implements TutorSessionsAttributes
{
  public id!: string;
  public tutorId!: string;
  public parentId!: string;
  public childName!: string;
  public startTime!: string;
  public offerId?: string; // Made optional to match nullable field
  public endTime?: string;
  public daysOfWeek!: string[];
  public price!: number;
  public meta?: object;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public status!: "active" | "cancelled" | "paused" | "completed";
  public month!: string; // yyyy-mm-dd format
  public totalSessions!: number;
  public sessionsCompleted!: number;
}

export function initTutorSessionsModel(
  sequelize: Sequelize
): typeof TutorSessions {
  TutorSessions.init(
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
      offerId: {
        type: DataTypes.UUID,
        allowNull: true, // Changed to true temporarily to handle existing data
        references: {
          model: "offers",
          key: "id",
        },
      },
      childName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      daysOfWeek: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        comment: "Array of days like ['mon', 'tue', 'fri'] or ['mon-fri']",
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Price per session in cents (e.g., 2500 for $25.00)",
      },
      meta: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "cancelled", "paused", "completed"),
        allowNull: false,
        defaultValue: "active",
      },
      month: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Month in yyyy-mm-dd format",
      },
      totalSessions: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sessionsCompleted: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "tutorSessions",
    }
  );

  TutorSessions.belongsTo(User, { foreignKey: "tutorId" });
  User.hasMany(TutorSessions, { foreignKey: "tutorId" });

  TutorSessions.belongsTo(User, { foreignKey: "parentId" });
  User.hasMany(TutorSessions, { foreignKey: "parentId" });

  TutorSessions.belongsTo(Offer, { foreignKey: "offerId" });
  Offer.hasMany(TutorSessions, { foreignKey: "offerId" });

  return TutorSessions;
}
