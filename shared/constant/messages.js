"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InfoMessages = {
  GENERIC: {
    ITEM_DELETE_SUCCESSFULLY: (key, id) =>
      `${key} item with ID: ${id} deleted successfully.`,
    ITEM_UPDATED_SUCCESSFULLY: (key, id) =>
      `${key} item with ID: ${id} updated successfully.`,
    ITEM_UPDATED_SUCCESSFULLY_ATTRIBUTE: (key, id, attribute) =>
      `Attribute ${attribute} of ${key} item with ID: ${id} updated successfully.`,
    ITEM_CREATED_SUCCESSFULLY: (key) => `${key} created successfully.`,
    ITEM_GET_SUCCESSFULLY: (key) => `${key} item fetched successfully.`,
  },
  AUTH: {
    PASSWORD_LENGTH_ERROR: "Password must be at least 8 characters long.",
    SIGNIN_SUCCESS: "Signed in successfully",
  },
};
exports.default = InfoMessages;
