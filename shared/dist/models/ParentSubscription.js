"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentSubscription = void 0;
exports.initParentSubscriptionModel = initParentSubscriptionModel;
const sequelize_1 = require("sequelize");
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
        childId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "children",
                key: "id",
            },
        },
        stripeSubscriptionId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('active', 'cancelled', 'expired'),
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
            allowNull: false,
        },
        amount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    }, {
        sequelize,
        tableName: "parent_subscriptions",
    });
    return ParentSubscription;
}
