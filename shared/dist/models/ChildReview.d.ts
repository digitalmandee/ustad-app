import { Model, Sequelize, Optional } from "sequelize";
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
export declare class ChildReview extends Model<ChildReviewAttributes, ChildReviewCreationAttributes> implements ChildReviewAttributes {
    id: string;
    childId: string;
    tutorId: string;
    rating: number;
    review: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initChildReviewModel(sequelize: Sequelize): typeof ChildReview;
