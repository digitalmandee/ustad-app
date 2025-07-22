"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
exports.initSubjectModel = initSubjectModel;
const sequelize_1 = require("sequelize");
class Subject extends sequelize_1.Model {
}
exports.Subject = Subject;
function initSubjectModel(sequelize) {
    Subject.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    }, {
        sequelize,
        tableName: "subjects",
    });
    return Subject;
}
