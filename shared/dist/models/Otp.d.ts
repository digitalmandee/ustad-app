import { Model, Optional, Sequelize } from 'sequelize';
import { OtpPurpose, OtpStatus, OtpType } from '../constant/enums';
interface OtpAttributes {
    id: string;
    userId: string;
    type: OtpType;
    purpose: OtpPurpose;
    status: OtpStatus;
    otp: string;
    expiry: Date;
    usedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}
interface OtpCreationAttributes extends Optional<OtpAttributes, 'id' | 'usedAt' | 'createdAt' | 'updatedAt'> {
}
export declare class Otp extends Model<OtpAttributes, OtpCreationAttributes> implements OtpAttributes {
    id: string;
    userId: string;
    type: OtpType;
    purpose: OtpPurpose;
    status: OtpStatus;
    otp: string;
    expiry: Date;
    usedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initOtpModel(sequelize: Sequelize): typeof Otp;
export {};
