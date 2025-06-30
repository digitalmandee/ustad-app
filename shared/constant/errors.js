"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorMessages = {
    VALIDATION: {
        MAX_LENGTH_ERROR: (key, character) => `${key} must be lesser than ${character} characters.`,
        VALUE_MUST_BE_STRING: (value) => `The ${value} must be a string.`,
        EMPTY_VALUE: (value) => `${value} cannot be empty.`,
        SPACE_ERROR: (value) => `No spaces are allowed in the ${value}.`,
        INVALID_DATA_TYPE: (value, expectedType) => `${value} must be of type ${expectedType}.`,
        KEY_MISSING: (key) => `${key} key is missing.`,
    },
    AUTH: {
        INVALID_ROLE: 'Role must be one of ADMIN, PARENT, or TUTOR.',
        USERNAME_LENGTH_MAX: (min, max) => `Username must be greater than ${min} characters and less than ${max + 1} characters.`,
        NAME_LENGTH_MAX: (min, max) => `Full name must be between ${min} and ${max} characters.`,
        INVALID_EMAIL: 'Email must be valid.',
        PASSWORD_COMPLEXITY: 'Password must contain at least one uppercase letter, one number, and one special character.',
    },
    GENERIC: {
        OPERATION_FAILED: (operation) => `Operation: ${operation} failed.`,
    },
};
exports.default = ErrorMessages;
