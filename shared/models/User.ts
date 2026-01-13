// user.model.ts
import { Model, DataTypes, Optional, Sequelize } from "sequelize";

import { UserRole, Gender } from "../constant/enums";
import { IsOnBaord } from "../constant/enums";

interface UserAttributes {
  id: string;
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
  // profilePic will be stored as base64 string
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

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "role"
    | "isActive"
    | "isAdminVerified"
    | "isOnBoard"
    | "gender"
    | "password"
    | "cnic"
    | "address"
    | "city"
    | "state"
    | "country"
    | "image"
    | "isEmailVerified"
    | "phone"
    | "isPhoneVerified"
    | "googleId"
    | "deviceId"
    | "createdAt"
    | "updatedAt"
    | "isDeleted"
  > {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public role!: UserRole;
  public isActive!: boolean;
  public isAdminVerified!: boolean;
  public isOnBoard!: IsOnBaord;
  public gender!: Gender;

  public firstName!: string;
  public lastName!: string;
  public password!: string | null;
  public cnic!: string | null;
  public address!: string | null;
  public city!: string | null;
  public state!: string | null;
  public country!: string | null;
  // profilePic will be stored as base64 string
  public image!: string | null;

  public email!: string;
  public isEmailVerified!: boolean;

  public phone!: string | null;
  public isPhoneVerified!: boolean;

  public googleId!: string | null;

  public deviceId!: string | null;

  public isDeleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initUserModel(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      role: {
        type: DataTypes.ENUM(...Object.values(UserRole)),
        allowNull: false,
        defaultValue: UserRole.PARENT,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isAdminVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isOnBoard: {
        type: DataTypes.ENUM(...Object.values(IsOnBaord)),
        allowNull: false,
        defaultValue: IsOnBaord.REQUIRED,
      },
      gender: {
        type: DataTypes.ENUM(...Object.values(Gender)),
        allowNull: false,
        defaultValue: Gender.OTHER,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cnic: {
        type: DataTypes.STRING(13),
        allowNull: true,
        unique: true,
      },
      address: DataTypes.STRING,
      city: DataTypes.STRING,
      state: DataTypes.STRING,
      country: DataTypes.STRING,
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      isPhoneVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      deviceId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        comment: "Device identifier for push notifications or device tracking",
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "users",
      sequelize,
      timestamps: true,
    }
  );

  return User;
}
