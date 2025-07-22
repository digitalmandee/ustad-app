"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildReview = void 0;
exports.initChildReviewModel = initChildReviewModel;
const sequelize_1 = require("sequelize");
const Child_1 = require("./Child");
const Tutor_1 = require("./Tutor");
class ChildReview extends sequelize_1.Model {
}
exports.ChildReview = ChildReview;
function initChildReviewModel(sequelize) {
    ChildReview.init({
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
        rating: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        review: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: "childReviews",
    });
    ChildReview.belongsTo(Child_1.Child, { foreignKey: "childId" });
    Child_1.Child.hasMany(ChildReview, { foreignKey: "childId" });
    ChildReview.belongsTo(Tutor_1.Tutor, { foreignKey: "tutorId" });
    Tutor_1.Tutor.hasMany(ChildReview, { foreignKey: "tutorId" });
    return ChildReview;
}
