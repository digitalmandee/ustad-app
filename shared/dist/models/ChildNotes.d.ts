import { Model, Sequelize, Optional } from "sequelize";
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
export declare class ChildNotes extends Model<ChildNotesAttributes, ChildNotesCreationAttributes> implements ChildNotesAttributes {
    id: string;
    childId: string;
    tutorId: string;
    headline: string;
    description: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initChildNotesModel(sequelize: Sequelize): typeof ChildNotes;
