const ErrorMessages = {
  VALIDATION: {
    MAX_LENGTH_ERROR: (key: string, character: number) => `${key} must be lesser than ${character} characters.`,
    VALUE_MUST_BE_STRING: (value: string) => `The ${value} must be a string.`,
    EMPTY_VALUE: (value: string) => `${value} cannot be empty.`,
    SPACE_ERROR: (value: string) => `No spaces are allowed in the ${value}.`,
    INVALID_DATA_TYPE: (value?: string, expectedType?: string) => `${value} must be of type ${expectedType}.`,
    KEY_MISSING: (key: string) => `${key} key is missing.`,
  },
  AUTH: {
    INVALID_ROLE: 'Role must be one of ADMIN, PARENT, or TUTOR.',
    USERNAME_LENGTH_MAX: (min: number, max: number) =>
      `Username must be greater than ${min} characters and less than ${max + 1} characters.`,
    NAME_LENGTH_MAX: (min: number, max: number) =>
      `Full name must be between ${min} and ${max} characters.`,
    INVALID_EMAIL: 'Email must be valid.',
    PASSWORD_COMPLEXITY: 'Password must contain at least one uppercase letter, one number, and one special character.',
  },
  GENERIC: {
    OPERATION_FAILED: (operation: string) => `Operation: ${operation} failed.`,
  },
};

export default ErrorMessages;
