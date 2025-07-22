import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Tutor } from "./Tutor";
import { Parent } from "./Parent";
import { Child } from "./Child";

export interface TutorSessionsAttributes {
  id: string;
  tutorId: string;
  parentId: string;
  childId: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number; // Duration in minutes (e.g., 60 for 1 hour, 120 for 2 hours)
  daysOfWeek: string[]; // Array of days like ["mon", "tue", "fri"] or ["mon-fri"]
  price: number; // Price per session in cents (e.g., 2500 for $25.00)
  meta?: object;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TutorSessionsCreationAttributes = Optional<TutorSessionsAttributes, "id">;

export class TutorSessions
  extends Model<TutorSessionsAttributes, TutorSessionsCreationAttributes>
  implements TutorSessionsAttributes
{
  public id!: string;
  public tutorId!: string;
  public parentId!: string;
  public childId!: string;
  public startedAt!: Date;
  public endedAt?: Date;
  public duration!: number;
  public daysOfWeek!: string[];
  public price!: number;
  public meta?: object;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorSessionsModel(sequelize: Sequelize): typeof TutorSessions {
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
          model: "tutors",
          key: "id",
        },
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "parents",
          key: "id",
        },
      },
      childId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "children",
          key: "id",
        },
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Duration in minutes (e.g., 60 for 1 hour, 120 for 2 hours)",
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
    },
    {
      sequelize,
      tableName: "tutorSessions",
    }
  );

  TutorSessions.belongsTo(Tutor, { foreignKey: "tutorId" });
  Tutor.hasMany(TutorSessions, { foreignKey: "tutorId" });

  TutorSessions.belongsTo(Parent, { foreignKey: "parentId" });
  Parent.hasMany(TutorSessions, { foreignKey: "parentId" });

  TutorSessions.belongsTo(Child, { foreignKey: "childId" });
  Child.hasMany(TutorSessions, { foreignKey: "childId" });

  return TutorSessions;
} 