import { body, query } from "express-validator";
import constant from "../../constant/constant";
import { UserRole } from "../../constant/enums";

export const tutorOnboardingValidationRules = () => {
  return [
    // body("subjects")
    //   .isArray()
    //   .withMessage("Subjects must be an array")
    //   .notEmpty()
    //   .withMessage("At least one subject is required"),
    body("bankName").notEmpty().withMessage("Bank name is required"),
    body("accountNumber")
      .notEmpty()
      .withMessage("Account number is required")
      .isNumeric()
      .withMessage("Account number must be numeric"),
  ];
};
export const tutorLocationValidationRules = () => {
  return [
    body("latitude")
      .notEmpty()
      .withMessage("latitude is required")
      .isFloat({ min: -90, max: 90 })
      .withMessage("latitude must be a valid float between -90 and 90")
      .toFloat(),

    body("longitude")
      .notEmpty()
      .withMessage("longitude is required")
      .isFloat({ min: -180, max: 180 })
      .withMessage("longitude must be a valid float between -180 and 180")
      .toFloat(),

    body("address")
      .isString()
      .withMessage("address must be a string")
      .trim()
      .isLength({ max: 255 })
      .withMessage("address must be at most 255 characters long"),
  ];
};

export const tutorSearchByLocationValidationRules = () => {
  return [
    query("latitude")
      .notEmpty()
      .withMessage("latitude is required")
      .isFloat({ min: -90, max: 90 })
      .withMessage("latitude must be a valid float between -90 and 90")
      .toFloat(),

    query("longitude")
      .notEmpty()
      .withMessage("longitude is required")
      .isFloat({ min: -180, max: 180 })
      .withMessage("longitude must be a valid float between -180 and 180")
      .toFloat(),

    query("radius")
      .notEmpty()
      .withMessage("radius is required")
      .isFloat({ min: 0.1, max: 100 })
      .withMessage("radius must be a valid float between 0.1 and 100")
      .toFloat(),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit must be an integer between 1 and 100")
      .toInt(),

    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("offset must be a non-negative integer")
      .toInt(),

    query("category")
      .optional()
      .isString()
      .withMessage("category must be a string")
      .isLength({ min: 1, max: 50 })
      .withMessage("category must be between 1 and 50 characters")
      .trim()
      .toLowerCase(),
  ];
};

export const editProfileValidationRules = () => {
  return [
    body("fullName")
      .optional()
      .isString()
      .withMessage("Full name must be a string")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters long"),
    
    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),
    
    body("phone")
      .optional()
      .matches(/^[0-9]{10,15}$/)
      .withMessage("Phone number must be between 10 and 15 digits"),
    
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  ];
};

export const validateRoles = (role: unknown): role is UserRole => {
  return (
    typeof role === "string" &&
    Object.values(UserRole).includes(role as UserRole)
  );
};

export const experienceValidationRules = () => {
  return [
    body("company")
      .notEmpty()
      .withMessage("Company name is required")
      .isString()
      .withMessage("Company name must be a string")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Company name must be at least 2 characters long"),
    
    body("startDate")
      .notEmpty()
      .withMessage("Start date is required")
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    
    body("endDate")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .withMessage("End date must be a valid date")
      .custom((endDate, { req }) => {
        if (new Date(endDate) <= new Date(req.body.startDate)) {
          throw new Error("End date must be after start date");
        }
        return true;
      }),
    
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isString()
      .withMessage("Description must be a string")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters long"),
  ];
};

export const educationValidationRules = () => {
  return [
    body("institute")
      .notEmpty()
      .withMessage("Institute name is required")
      .isString()
      .withMessage("Institute name must be a string")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Institute name must be at least 2 characters long"),
    
    body("startDate")
      .notEmpty()
      .withMessage("Start date is required")
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    
    body("endDate")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .withMessage("End date must be a valid date")
      .custom((endDate, { req }) => {
        if (new Date(endDate) <= new Date(req.body.startDate)) {
          throw new Error("End date must be after start date");
        }
        return true;
      }),
    
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isString()
      .withMessage("Description must be a string")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters long"),
  ];
};

export const tutorSettingsValidationRules = () => [
  body("minSubjects")
    .exists().withMessage("minSubjects is required")
    .isInt({ min: 1 }).withMessage("minSubjects must be an integer >= 1"),
  body("maxStudentsDaily")
    .exists().withMessage("maxStudentsDaily is required")
    .isInt({ min: 1 }).withMessage("maxStudentsDaily must be an integer >= 1"),
  body("subjectCosts")
    .exists().withMessage("subjectCosts is required")
    .isObject().withMessage("subjectCosts must be an object")
    .custom((value) => {
      if (typeof value !== "object" || Array.isArray(value)) return false;
      for (const key in value) {
        const entry = value[key];
        if (
          typeof entry !== "object" ||
          typeof entry.cost !== "number" || entry.cost < 0 ||
          typeof entry.active !== "boolean"
        ) {
          throw new Error("Each subject must have a cost (number >= 0) and active (boolean)");
        }
      }
      return true;
    }),
];

export const paymentRequestValidationRules = () => [
  body("amount")
    .exists().withMessage("Amount is required")
    .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number")
    .toFloat(),
];
