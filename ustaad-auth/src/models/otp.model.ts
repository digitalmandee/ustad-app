// otp.model.ts
import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { User } from './user.model';
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

interface OtpCreationAttributes
  extends Optional<OtpAttributes, 'id' | 'usedAt' | 'createdAt' | 'updatedAt'> {}

export class Otp extends Model<OtpAttributes, OtpCreationAttributes> implements OtpAttributes {
  public id!: string;
  public userId!: string;
  public type!: OtpType;
  public purpose!: OtpPurpose;
  public status!: OtpStatus;
  public otp!: string;
  public expiry!: Date;
  public usedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initOtpModel(sequelize: Sequelize): typeof Otp {
  Otp.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: User.tableName,
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM(...Object.values(OtpType)),
        allowNull: false,
      },
      purpose: {
        type: DataTypes.ENUM(...Object.values(OtpPurpose)),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(OtpStatus)),
        allowNull: false,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expiry: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      usedAt: {
        type: DataTypes.DATE,
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
      tableName: 'otps',
      sequelize,
      timestamps: true,
    }
  );

  Otp.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Otp, { foreignKey: 'userId', as: 'otps' });

  return Otp;
}
