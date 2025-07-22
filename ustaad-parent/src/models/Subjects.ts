import { Model, DataTypes, Sequelize, Optional } from "sequelize";

export interface SubjectAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SubjectCreationAttributes = Optional<SubjectAttributes, "id">;

export class Subject
  extends Model<SubjectAttributes, SubjectCreationAttributes>
  implements SubjectAttributes
{
  public id!: number;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initSubjectModel(sequelize: Sequelize): typeof Subject {
  Subject.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      tableName: "subjects",
    }
  );

  return Subject;
}
