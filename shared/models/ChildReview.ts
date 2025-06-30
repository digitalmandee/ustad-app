import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Child } from "./Child";
import { Tutor } from "./Tutor";

export interface ChildReviewAttributes {
  id: string;
  childId: string;
  tutorId: string;
  rating: number;
  review: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ChildReviewCreationAttributes = Optional<ChildReviewAttributes, "id">;

export class ChildReview
  extends Model<ChildReviewAttributes, ChildReviewCreationAttributes>
  implements ChildReviewAttributes
{
  public id!: string;
  public childId!: string;
  public tutorId!: string;
  public rating!: number;
  public review!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initChildReviewModel(sequelize: Sequelize): typeof ChildReview {
  ChildReview.init(
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
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      review: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "childReviews",
    }
  );

  ChildReview.belongsTo(Child, { foreignKey: "childId" });
  Child.hasMany(ChildReview, { foreignKey: "childId" });

  ChildReview.belongsTo(Tutor, { foreignKey: "tutorId" });
  Tutor.hasMany(ChildReview, { foreignKey: "tutorId" });

  return ChildReview;
} 