import { Model, Sequelize, Optional } from "sequelize";
export interface TutorLocationAttributes {
    id: string;
    tutorId: string;
    latitude: number;
    longitude: number;
    address: string;
    geoHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export type TutorLocationCreationAttributes = Optional<TutorLocationAttributes, "id" | "createdAt" | "updatedAt">;
export declare class TutorLocation extends Model<TutorLocationAttributes, TutorLocationCreationAttributes> implements TutorLocationAttributes {
    id: string;
    tutorId: string;
    latitude: number;
    longitude: number;
    address: string;
    geoHash: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initTutorLocationModel(sequelize: Sequelize): typeof TutorLocation;
