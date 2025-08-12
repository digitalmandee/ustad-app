"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentSubscription = void 0;
exports.initParentSubscriptionModel = initParentSubscriptionModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
const Offer_1 = require("./Offer");
class ParentSubscription extends sequelize_1.Model {
}
exports.ParentSubscription = ParentSubscription;
function initParentSubscriptionModel(sequelize) {
    ParentSubscription.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        parentId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        tutorId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        offerId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "offers",
                key: "id",
            },
        },
        stripeSubscriptionId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('active', 'cancelled', 'expired', 'created'),
            allowNull: false,
            defaultValue: 'active',
        },
        planType: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        startDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        endDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        amount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: "parent_subscriptions",
    });
    ParentSubscription.belongsTo(Offer_1.Offer, { foreignKey: "offerId" });
    Offer_1.Offer.hasMany(ParentSubscription, { foreignKey: "offerId" });
    ParentSubscription.belongsTo(User_1.User, { foreignKey: "parentId" });
    User_1.User.hasMany(ParentSubscription, { foreignKey: "parentId" });
    ParentSubscription.belongsTo(User_1.User, { foreignKey: "tutorId" });
    User_1.User.hasMany(ParentSubscription, { foreignKey: "tutorId" });
    return ParentSubscription;
}
