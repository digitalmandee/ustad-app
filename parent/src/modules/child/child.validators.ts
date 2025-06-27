import { body } from "express-validator";

export const addChildValidationRules = () => {
  return [
    body("fullName")
      .notEmpty()
      .withMessage("Full name is required")
      .isString()
      .withMessage("Full name must be a string")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters long"),

    body("gender")
      .notEmpty()
      .withMessage("Gender is required")
      .isString()
      .withMessage("Gender must be a string")
      .trim()
      .isIn(["male", "female"])
      .withMessage("Gender must be either male, female, or other"),
    body("grade")
      .notEmpty()
      .withMessage("Grade is required")
      .isString()
      .withMessage("Grade must be a string")
      .trim()
      .matches(/^[1-9]|1[0-2]$/)
      .withMessage("Grade must be a number between 1 and 12"),

    body("age")
      .notEmpty()
      .withMessage("Age is required")
      .isInt({ min: 1, max: 25 })
      .withMessage("Age must be between 1 and 25 years"),

    body("schoolName")
      .notEmpty()
      .withMessage("School name is required")
      .isString()
      .withMessage("School name must be a string")
      .trim()
      .isLength({ min: 2 })
      .withMessage("School name must be at least 2 characters long"),
  ];
}; 