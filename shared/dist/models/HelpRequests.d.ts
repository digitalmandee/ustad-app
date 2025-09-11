import { Model, Sequelize } from "sequelize";
import { HelpRequestStatus, UserRole } from "../constant/enums";
export interface HelpRequestsAttributes {
    id: string;
    requesterId: string;
    againstId?: string;
    subject: string;
    status: HelpRequestStatus;
    message?: string;
    requester: UserRole;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class HelpRequests extends Model<HelpRequestsAttributes> implements HelpRequestsAttributes {
    id: string;
    requesterId: string;
    againstId?: string;
    subject: string;
    status: HelpRequestStatus;
    message?: string;
    requester: UserRole;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initHelpRequestsModel(sequelize: Sequelize): typeof HelpRequests;
