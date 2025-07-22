"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildNotes = void 0;
exports.initChildNotesModel = initChildNotesModel;
const sequelize_1 = require("sequelize");
const Child_1 = require("./Child");
const Tutor_1 = require("./Tutor");
class ChildNotes extends sequelize_1.Model {
}
exports.ChildNotes = ChildNotes;
function initChildNotesModel(sequelize) {
    ChildNotes.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        childId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "children",
                key: "id",
            },
        },
        tutorId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "tutors",
                key: "id",
            },
        },
        headline: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: "childNotes",
    });
    ChildNotes.belongsTo(Child_1.Child, { foreignKey: "childId" });
    Child_1.Child.hasMany(ChildNotes, { foreignKey: "childId" });
    ChildNotes.belongsTo(Tutor_1.Tutor, { foreignKey: "tutorId" });
    Tutor_1.Tutor.hasMany(ChildNotes, { foreignKey: "tutorId" });
    return ChildNotes;
}
