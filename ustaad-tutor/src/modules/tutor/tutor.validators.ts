import { body, query } from "express-validator";
import constant from "../../constant/constant";
import { UserRole } from "@ustaad/shared";

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
    body("grade")
      .customSanitizer((value) => {
        // If it's a string that looks like an array, parse it
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
          } catch (e) {
            return [value]; // Fallback to wrapping it in an array
          }
        }
        return value;
      })
      .isArray()
      .withMessage("Grade must be an array"),

    body("curriculum")
      .customSanitizer((value) => {
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
          } catch (e) {
            return [value];
          }
        }
        return value;
      })
      .isArray()
      .withMessage("Curriculum must be an array"),
  ];
};

export const updateBankDetailsValidationRules = () => {
  return [
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
    body("firstName")
      .optional()
      .isString()
      .withMessage("First name must be a string")
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters long"),

    body("lastName")
      .optional()
      .isString()
      .withMessage("Last name must be a string")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name must be provided"),

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
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
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
      .optional({ nullable: true, checkFalsy: true })
      .custom((endDate, { req }) => {
        if (endDate === "Present") {
          return true;
        }
        if (!endDate) return true;
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          throw new Error("End date must be a valid date or 'Present'");
        }
        if (date <= new Date(req.body.startDate)) {
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

    body("designation")
      .notEmpty()
      .withMessage("designation is required")
      .isString()
      .withMessage("designation must be a string")
      .trim(),
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
      .optional({ nullable: true, checkFalsy: true })
      .custom((endDate, { req }) => {
        if (endDate === "Present") {
          return true;
        }
        if (!endDate) return true;
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          throw new Error("End date must be a valid date or 'Present'");
        }
        if (date <= new Date(req.body.startDate)) {
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
    .exists()
    .withMessage("minSubjects is required")
    .isInt({ min: 1 })
    .withMessage("minSubjects must be an integer >= 1"),
  body("maxStudentsDaily")
    .exists()
    .withMessage("maxStudentsDaily is required")
    .isInt({ min: 1 })
    .withMessage("maxStudentsDaily must be an integer >= 1"),
  body("subjectCosts")
    .exists()
    .withMessage("subjectCosts is required")
    .isObject()
    .withMessage("subjectCosts must be an object")
    .custom((value) => {
      if (typeof value !== "object" || Array.isArray(value)) return false;
      for (const key in value) {
        const entry = value[key];
        if (
          typeof entry !== "object" ||
          typeof entry.cost !== "number" ||
          entry.cost < 0 ||
          typeof entry.active !== "boolean"
        ) {
          throw new Error(
            "Each subject must have a cost (number >= 0) and active (boolean)"
          );
        }
      }
      return true;
    }),
];

export const paymentRequestValidationRules = () => [
  body("amount")
    .exists()
    .withMessage("Amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number")
    .toFloat(),
];

export const helpRequestValidationRules = () => {
  return [
    body("subject")
      .notEmpty()
      .withMessage("Subject is required")
      .isString()
      .withMessage("Subject must be a string")
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Subject must be between 5 and 200 characters"),
    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isString()
      .withMessage("Message must be a string")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Message must be between 10 and 1000 characters"),
    body("againstId")
      .optional()
      .isUUID()
      .withMessage("Against ID must be a valid UUID"),
  ];
};

export const childNoteValidationRules = () => {
  return [
    body("sessionId")
      .notEmpty()
      .withMessage("Session ID is required")
      .isUUID()
      .withMessage("Session ID must be a valid UUID"),
    body("headline")
      .notEmpty()
      .withMessage("Headline is required")
      .isString()
      .withMessage("Headline must be a string")
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("Headline must be between 3 and 100 characters"),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isString()
      .withMessage("Description must be a string")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Description must be between 10 and 1000 characters"),
  ];
};

export const aboutValidationRules = () => {
  return [
    body("about").optional().isString().withMessage("About must be a string"),
    // body("subjects")
    //   .customSanitizer((value) => {
    //     // If it's a string that looks like an array, parse it
    //     if (typeof value === "string") {
    //       try {
    //         const parsed = JSON.parse(value);
    //         return Array.isArray(parsed) ? parsed : [value];
    //       } catch (e) {
    //         return [value]; // Fallback to wrapping it in an array
    //       }
    //     }
    //     return value;
    //   })
    //   .isArray()
    //   .withMessage("subjects must be an array"),
    // body("grade")
    //   .customSanitizer((value) => {
    //     // If it's a string that looks like an array, parse it
    //     if (typeof value === "string") {
    //       try {
    //         const parsed = JSON.parse(value);
    //         return Array.isArray(parsed) ? parsed : [value];
    //       } catch (e) {
    //         return [value]; // Fallback to wrapping it in an array
    //       }
    //     }
    //     return value;
    //   })
    //   .isArray()
    //   .withMessage("Grade must be an array"),

    // body("curriculum")
    //   .customSanitizer((value) => {
    //     if (typeof value === "string") {
    //       try {
    //         const parsed = JSON.parse(value);
    //         return Array.isArray(parsed) ? parsed : [value];
    //       } catch (e) {
    //         return [value];
    //       }
    //     }
    //     return value;
    //   })
    //   .isArray()
    //   .withMessage("Curriculum must be an array"),
  ];
};
