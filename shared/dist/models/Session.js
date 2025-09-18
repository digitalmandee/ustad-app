"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
exports.initSessionModel = initSessionModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class Session extends sequelize_1.Model {
}
exports.Session = Session;
function initSessionModel(sequelize) {
    Session.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: User_1.User,
                key: 'id',
            },
        },
        token: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
            unique: true,
        },
        expiresAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: 'sessions',
        indexes: [
            {
                unique: true,
                fields: ['token'],
            },
        ],
    });
    // Define the association
    Session.belongsTo(User_1.User, { foreignKey: 'userId' });
    User_1.User.hasMany(Session, { foreignKey: 'userId' });
    return Session;
}
