"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorLocation = void 0;
exports.initTutorLocationModel = initTutorLocationModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
class TutorLocation extends sequelize_1.Model {
}
exports.TutorLocation = TutorLocation;
function initTutorLocationModel(sequelize) {
    TutorLocation.init({
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
            onDelete: "CASCADE",
        },
        latitude: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        longitude: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        address: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        geoHash: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: "tutor_locations",
        timestamps: true,
        indexes: [
            {
                name: "idx_geohash",
                fields: ["geoHash"],
            },
        ],
    });
    TutorLocation.belongsTo(User_1.User, { foreignKey: "tutorId", as: "tutor" });
    User_1.User.hasMany(TutorLocation, { foreignKey: "tutorId", as: "locations" });
    return TutorLocation;
}
