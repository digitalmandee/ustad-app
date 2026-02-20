"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentSubscription = void 0;
exports.initParentSubscriptionModel = initParentSubscriptionModel;
const sequelize_1 = require("sequelize");
const User_1 = require("./User");
const Offer_1 = require("./Offer");
const enums_1 = require("../constant/enums");
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
            // Added offerId
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: "offers",
                key: "id",
            },
        },
        status: {
            type: sequelize_1.DataTypes.ENUM(enums_1.ParentSubscriptionStatus.ACTIVE, enums_1.ParentSubscriptionStatus.CANCELLED, enums_1.ParentSubscriptionStatus.EXPIRED, enums_1.ParentSubscriptionStatus.CREATED, enums_1.ParentSubscriptionStatus.DISPUTE, enums_1.ParentSubscriptionStatus.COMPLETED, enums_1.ParentSubscriptionStatus.PENDING_COMPLETION),
            allowNull: false,
            defaultValue: enums_1.ParentSubscriptionStatus.ACTIVE,
        },
        disputeReason: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        disputedBy: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: "users",
                key: "id",
            },
        },
        disputedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
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
        // PayFast fields
        basketId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            comment: "PayFast basket ID for the subscription",
        },
        instrumentToken: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            comment: "PayFast recurring payment token",
        },
        nextBillingDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            comment: "Next recurring payment date",
        },
        lastPaymentDate: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            comment: "Last successful payment date",
        },
        lastPaymentAmount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: "Last successful payment amount",
        },
        failureCount: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Consecutive payment failures",
        },
        isRefunded: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
