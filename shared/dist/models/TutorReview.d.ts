import { Model, Sequelize, Optional } from "sequelize";
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
export declare class TutorReview extends Model<TutorReviewAttributes, TutorReviewCreationAttributes> implements TutorReviewAttributes {
    id: string;
    tutorId: string;
    parentId: string;
    rating: number;
    review: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorReviewModel(sequelize: Sequelize): typeof TutorReview;
