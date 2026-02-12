import { Model, Optional, Sequelize } from "sequelize";
import { UserRole, Gender } from "../constant/enums";
import { IsOnBaord } from "../constant/enums";
interface UserAttributes {
    id: string;
    userId: string;
    role: UserRole;
    isActive: boolean;
    isAdminVerified: boolean;
    isOnBoard: IsOnBaord;
    gender: Gender;
    firstName: string;
    lastName: string;
    password?: string | null;
    cnic?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    image?: string | null;
    email: string;
    isEmailVerified: boolean;
    phone?: string | null;
    isPhoneVerified: boolean;
    googleId?: string | null;
    deviceId?: string | null;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, "id" | "userId" | "role" | "isActive" | "isAdminVerified" | "isOnBoard" | "gender" | "password" | "cnic" | "address" | "city" | "state" | "country" | "image" | "isEmailVerified" | "phone" | "isPhoneVerified" | "googleId" | "deviceId" | "createdAt" | "updatedAt" | "isDeleted"> {
}
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    userId: string;
    role: UserRole;
    isActive: boolean;
    isAdminVerified: boolean;
    isOnBoard: IsOnBaord;
    gender: Gender;
    firstName: string;
    lastName: string;
    password: string | null;
    cnic: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    image: string | null;
    email: string;
    isEmailVerified: boolean;
    phone: string | null;
    isPhoneVerified: boolean;
    googleId: string | null;
    deviceId: string | null;
    isDeleted: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initUserModel(sequelize: Sequelize): typeof User;
export {};
