import { body } from "express-validator";

export const addChildValidationRules = () => {
  return [
    body("firstName")
      .notEmpty()
      .withMessage("First name is required")
      .isString()
      .withMessage("First name must be a string")
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters long"),
    body("lastName")
      .notEmpty()
      .withMessage("Last name is required")
      .isString()
      .withMessage("Last name must be a string")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name must be provided"),

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

    body("image").optional().isString().withMessage("Image must be a string"),
  ];
};
