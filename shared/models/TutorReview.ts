import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { Child } from "./Child";
import { Tutor } from "./Tutor";
import { User } from "./User";

export interface TutorReviewAttributes {
  id: string;
  tutorId: string;
  parentId: string;
  rating: number;
  review: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TutorReviewCreationAttributes = Optional<TutorReviewAttributes, "id">;

export class TutorReview
  extends Model<TutorReviewAttributes, TutorReviewCreationAttributes>
  implements TutorReviewAttributes
{
  public id!:  string;
  public tutorId!: string;
  public parentId!: string;
  public rating!: number;
  public review!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTutorReviewModel(sequelize: Sequelize): typeof TutorReview {
  TutorReview.init(
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
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      review: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "tutorReviews",
    }
  );

  TutorReview.belongsTo(User, { foreignKey: "tutorId" });
  User.hasMany(TutorReview, { foreignKey: "tutorId" });

  TutorReview.belongsTo(User, { foreignKey: "parentId" });
  User.hasMany(TutorReview, { foreignKey: "parentId" });

  return TutorReview;
} 