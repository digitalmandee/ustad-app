"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parent = void 0;
exports.initParentModel = initParentModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class Parent extends sequelize_1.Model {
}
exports.Parent = Parent;
function initParentModel(sequelize) {
    Parent.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
                model: "users",
                key: "id",
            },
        },
        idFrontUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        idBackUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        customerId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        }
    }, {
        sequelize,
        tableName: "parents",
    });
    Parent.belongsTo(User_1.User, { foreignKey: "userId" });
    User_1.User.hasOne(Parent, { foreignKey: "userId" });
    return Parent;
}
