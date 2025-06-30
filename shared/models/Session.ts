import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { User } from './User';

export interface SessionAttributes {
  id: number;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Session extends Model<SessionAttributes> implements SessionAttributes {
  public id!: number;
  public userId!: string;
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
        type: DataTypes.UUID,
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
