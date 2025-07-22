"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
exports.initAllModels = initAllModels;
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
// ... import others
function initAllModels(sequelize) {
    (0, User_1.initUserModel)(sequelize);
    //   initTutorModel(sequelize);
}
