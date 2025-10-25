import { Model, Sequelize } from "sequelize";
import { HelpRequestStatus, UserRole, HelpRequestType } from "../constant/enums";
export interface HelpRequestsAttributes {
    id: string;
    requesterId: string;
    againstId?: string;
    subject: string;
    status: HelpRequestStatus;
    message?: string;
    requester: UserRole;
    type?: HelpRequestType;
    data?: JSON;
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
    type?: HelpRequestType;
    data?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initHelpRequestsModel(sequelize: Sequelize): typeof HelpRequests;
