import express from "express";
import TutorController from "./parent.controller";
import { validateRequest } from "../../middlewares";
import multer from "multer";
import {
  editProfileValidationRules,
  experienceValidationRules,
  educationValidationRules,
} from "./parent.validators";
import routes from "../../routes/routes";
import { authenticateJwt } from "../../middlewares/auth";
import { Router } from 'express';
import ParentController from './parent.controller';

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
  tutorController.onboardParent
);

router.post(
  routes.PARENT_Profile_EDIT,
  authenticateJwt,
  editProfileValidationRules(),
  validateRequest,
  authenticateJwt,
  tutorController.editProfile
);

router.get(routes.PARENT_Profile, authenticateJwt, tutorController.getProfile);

router.post(
  routes.ADD_PARENT_CUSTOMER_ID,
  authenticateJwt,
  tutorController.updateCustomerId
);

router.put('/customer-id', authenticateJwt, parentController.updateCustomerId);

router.post('/subscription', authenticateJwt, parentController.createSubscription);
router.put('/subscription/cancel', authenticateJwt, parentController.cancelSubscription);

export { router as tutorRouter };
