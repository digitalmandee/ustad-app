import { Model, Sequelize, Optional } from "sequelize";
export interface SubjectAttributes {
    id: number;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export type SubjectCreationAttributes = Optional<SubjectAttributes, "id">;
export declare class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
    id: number;
    name: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initSubjectModel(sequelize: Sequelize): typeof Subject;
