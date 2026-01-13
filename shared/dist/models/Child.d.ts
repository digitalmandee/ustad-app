import { Model, Sequelize, Optional } from "sequelize";
export interface ChildAttributes {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    gender: string;
    grade: string;
    age: number;
    schoolName: string;
    image?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export type ChildCreationAttributes = Optional<ChildAttributes, "id">;
export declare class Child extends Model<ChildAttributes, ChildCreationAttributes> implements ChildAttributes {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    gender: string;
    grade: string;
    age: number;
    schoolName: string;
    image?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initChildModel(sequelize: Sequelize): typeof Child;
