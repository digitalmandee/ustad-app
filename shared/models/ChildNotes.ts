import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Child } from "./Child";
import { Tutor } from "./Tutor";

export interface ChildNotesAttributes {
  id: string;
  childId: string;
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
  public childId!: string;
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
      childId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "children",
          key: "id",
        },
      },
      tutorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tutors",
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

  ChildNotes.belongsTo(Child, { foreignKey: "childId" });
  Child.hasMany(ChildNotes, { foreignKey: "childId" });

  ChildNotes.belongsTo(Tutor, { foreignKey: "tutorId" });
  Tutor.hasMany(ChildNotes, { foreignKey: "tutorId" });

  return ChildNotes;
} 