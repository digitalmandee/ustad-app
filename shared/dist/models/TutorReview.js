"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorReview = void 0;
exports.initTutorReviewModel = initTutorReviewModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class TutorReview extends sequelize_1.Model {
}
exports.TutorReview = TutorReview;
function initTutorReviewModel(sequelize) {
    TutorReview.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        tutorId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        parentId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        rating: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        review: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        sequelize,
        tableName: "tutorReviews",
    });
    TutorReview.belongsTo(User_1.User, { foreignKey: "tutorId" });
    User_1.User.hasMany(TutorReview, { foreignKey: "tutorId" });
    TutorReview.belongsTo(User_1.User, { foreignKey: "parentId" });
    User_1.User.hasMany(TutorReview, { foreignKey: "parentId" });
    return TutorReview;
}
