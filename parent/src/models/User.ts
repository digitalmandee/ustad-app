// user.model.ts
import { Model, DataTypes, Optional, Sequelize } from "sequelize";


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
  image?: string | null;

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
    | "password"
    | "cnic"
    | "address"
    | "city"
    | "state"
    | "country"
    | "profilePic"
    | "isEmailVerified"
    | "phone"
    | "isPhoneVerified"
    | "googleId"
    | "image"
    | "createdAt"
    | "updatedAt"
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

  public fullName!: string;
  public password!: string | null;
  public cnic!: string | null;
  public address!: string | null;
  public city!: string | null;
  public state!: string | null;
  public country!: string | null;
  public profilePic!: string | null;

  public email!: string;
  public isEmailVerified!: boolean;

  public phone!: string | null;
  public isPhoneVerified!: boolean;

  public googleId!: string | null;
  public image!: string | null;

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
      fullName: {
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
      profilePic: {
        type: DataTypes.STRING,
        defaultValue: "",
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
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
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
