import { Model, Optional, Sequelize } from "sequelize";
import { UserRole } from "../constant/enums";
import { IsOnBaord } from "../constant/enums";
interface UserAttributes {
    id: string;
    role: UserRole;
    isActive: boolean;
    isAdminVerified: boolean;
    isOnBoard: IsOnBaord;
    fullName: string;
    password?: string | null;
    cnic?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    profilePic?: string | null;
    email: string;
    isEmailVerified: boolean;
    phone?: string | null;
    isPhoneVerified: boolean;
    googleId?: string | null;
    deviceId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, "id" | "role" | "isActive" | "isAdminVerified" | "isOnBoard" | "password" | "cnic" | "address" | "city" | "state" | "country" | "profilePic" | "isEmailVerified" | "phone" | "isPhoneVerified" | "googleId" | "deviceId" | "createdAt" | "updatedAt"> {
}
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    role: UserRole;
    isActive: boolean;
    isAdminVerified: boolean;
    isOnBoard: IsOnBaord;
    fullName: string;
    password: string | null;
    cnic: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    profilePic: string | null;
    email: string;
    isEmailVerified: boolean;
    phone: string | null;
    isPhoneVerified: boolean;
    googleId: string | null;
    deviceId: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initUserModel(sequelize: Sequelize): typeof User;
export {};
