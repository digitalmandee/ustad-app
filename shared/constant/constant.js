"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant = {
    NAME: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 50,
    },
    PASSWORD: {
        MIN_LENGTH: 8,
    },
    USER_ROLE: {
        ADMIN: 'ADMIN',
        PARENT: 'PARENT',
        TUTOR: 'TUTOR',
    },
    VALIDATION: {
        KEY_MISSING: (key) => `${key} is required.`,
        EMPTY_VALUE: (key) => `${key} should not be empty.`,
        VALUE_MUST_BE_STRING: (key) => `${key} must be a string.`,
        SPACE_ERROR: (key) => `${key} must not contain consecutive spaces or invalid characters.`,
    },
    AUTH: {
        INVALID_ROLE: 'Role must be one of ADMIN, PARENT, or TUTOR.',
        INVALID_EMAIL: 'Please provide a valid email address.',
        INVALID_PHONE: 'Phone must be between 10 to 15 digits.',
        INVALID_CNIC: 'CNIC must be exactly 13 digits.',
        PASSWORD_MIN_LENGTH: (min) => `Password must be at least ${min} characters.`,
        PASSWORD_COMPLEXITY: 'Password must include at least one uppercase letter, one number, and one special character.',
        PASSWORD_CONFIRM_MISMATCH: 'Passwords do not match.',
        NAME_LENGTH_MAX: (min, max) => `Name must be between ${min} and ${max} characters.`,
    },
};
exports.default = constant;
