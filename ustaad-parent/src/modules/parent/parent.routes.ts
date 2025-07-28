import express from "express";
import TutorController from "./parent.controller";
import { validateRequest } from "../../middlewares";
import multer from "multer";
import {
  editProfileValidationRules,
  experienceValidationRules,
  educationValidationRules,
  createPaymentMethodValidationRules,
  updatePaymentMethodValidationRules,
  deletePaymentMethodValidationRules,
    } from "./parent.validators";
import routes from "../../routes/routes";
import { authenticateJwt } from "../../middlewares/auth";
import { Router } from 'express';
import ParentController from './parent.controller';
import { authorizeRoles } from "../../middlewares/role-auth";

const tutorController = new TutorController();
const router = Router();
const parentController = new ParentController();

const upload = multer({ storage: multer.memoryStorage() });
const uploadFields = upload.fields([
  { name: "idFront", maxCount: 1 },
  { name: "idBack", maxCount: 1 },
]);

router.post(
  routes.PARENT_ONBOARDING,
  uploadFields,
  validateRequest,
  authenticateJwt,
  authorizeRoles("PARENT"),
  tutorController.onboardParent
);

router.post(
  routes.PARENT_Profile_EDIT,
  authenticateJwt,
  editProfileValidationRules(),
  validateRequest,
  authenticateJwt,
  authorizeRoles("PARENT"),
  tutorController.editProfile
);

router.get(routes.PARENT_Profile, authenticateJwt, authorizeRoles("PARENT"), tutorController.getProfile);

// Payment Method routes
router.post(
  routes.PARENT_PAYMENT_METHODS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  createPaymentMethodValidationRules(),
  validateRequest,
  parentController.createPaymentMethod
);

router.get(
  routes.PARENT_PAYMENT_METHODS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.getPaymentMethods
);


router.put(
  routes.PARENT_PAYMENT_METHODS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  updatePaymentMethodValidationRules(),
  validateRequest,
  parentController.updatePaymentMethod
);

router.delete(
  routes.PARENT_PAYMENT_METHODS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  deletePaymentMethodValidationRules(),
  validateRequest,
  parentController.deletePaymentMethod
);

router.get(routes.GET_TUTOR_PROFILE, authenticateJwt, authorizeRoles("PARENT"), parentController.getTutorProfile);

  export { router as tutorRouter };
