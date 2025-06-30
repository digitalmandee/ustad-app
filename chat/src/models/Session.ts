import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { User } from '../modules/auth/user.model';

export interface SessionAttributes {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Session extends Model<SessionAttributes> implements SessionAttributes {
  public id!: number;
  public userId!: number;
  public token!: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initSessionModel(sequelize: Sequelize): typeof Session {
  Session.init(
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
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'sessions',
      indexes: [
        {
          unique: true,
          fields: ['token'],
        },
      ],
    }
  );
  // Define the association
  Session.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(Session, { foreignKey: 'userId' });

  return Session;
}
