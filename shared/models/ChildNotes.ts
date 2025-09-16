import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";
import { TutorSessionsDetail } from "./TutorSessionsDetail";

export interface ChildNotesAttributes {
  id: string;
  sessionId: string;
  childName: string;
  tutorId: string;
  headline: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ChildNotesCreationAttributes = Optional<ChildNotesAttributes, "id">;

export class ChildNotes
  extends Model<ChildNotesAttributes, ChildNotesCreationAttributes>
  implements ChildNotesAttributes
{
  public id!: string;
  public sessionId!: string;
  public childName!: string;
  public tutorId!: string;
  public headline!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initChildNotesModel(sequelize: Sequelize): typeof ChildNotes {
  ChildNotes.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tutorSessionsDetail",
          key: "id",
        },
      },
      childName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tutorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      headline: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "childNotes",
    }
  );

  ChildNotes.belongsTo(TutorSessionsDetail, { foreignKey: "sessionId" });
  TutorSessionsDetail.hasMany(ChildNotes, { foreignKey: "sessionId" });

  ChildNotes.belongsTo(User, { foreignKey: "tutorId" });
  User.hasMany(ChildNotes, { foreignKey: "tutorId" });

  return ChildNotes;
} 