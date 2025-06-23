import { body } from "express-validator";
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
