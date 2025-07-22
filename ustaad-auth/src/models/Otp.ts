import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { User } from './user.model';
import { OtpType } from '../common/enums';


export interface OtpAttributes {
  id: number;
  userId: number;
  type: OtpType;
  code: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Otp extends Model<OtpAttributes> implements OtpAttributes {
  public id!: number;
  public userId!: number;
  public type!: OtpType;
  public code!: string;
  public expiresAt!: Date;
  public attempts!: number;
  public isUsed!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initOtpModel(sequelize: Sequelize): typeof Otp {
  Otp.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'id',
        },
      },
      type: {
        type: DataTypes.ENUM(...Object.values(OtpType)),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'otps',
      indexes: [
        {
          fields: ['userId', 'type'],
        },
      ],
    }
  );

  // Define the association
  Otp.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(Otp, { foreignKey: 'userId' });

  return Otp;
} 