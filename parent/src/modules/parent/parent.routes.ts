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

const tutorController = new TutorController();
const router = express.Router();

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

export { router as tutorRouter };
