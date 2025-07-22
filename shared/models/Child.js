"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Child = void 0;
exports.initChildModel = initChildModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class Child extends sequelize_1.Model {
}
exports.Child = Child;
function initChildModel(sequelize) {
    Child.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        fullName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        gender: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        grade: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        age: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        schoolName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        sequelize,
        tableName: "children",
    });
    Child.belongsTo(User_1.User, { foreignKey: "userId" });
    User_1.User.hasMany(Child, { foreignKey: "userId" });
    return Child;
}
