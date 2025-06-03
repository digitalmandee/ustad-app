import express from "express";
import TutorController from "./tutor.controller";
import { validateRequest } from "../../middlewares";
import multer from "multer";
import { tutorOnboardingValidationRules } from "./tutor.validators";
import routes from "../../routes/routes";
import { authenticateJwt } from "../../middlewares/auth";
import { editProfileValidationRules } from "./tutor.validators";

const tutorController = new TutorController();
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });
const uploadFields = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "idFront", maxCount: 1 },
  { name: "idBack", maxCount: 1 },
]);

router.post(
  routes.TUTOR_ONBOARDING,
  uploadFields,
  tutorOnboardingValidationRules(),
  validateRequest,
  authenticateJwt,
  tutorController.onboardTutor
);

router.post(
  routes.TUTOR_Profile_EDIT,
  authenticateJwt,
  editProfileValidationRules(),
  validateRequest,
  authenticateJwt,
  tutorController.editProfile
);

router.get(
  routes.TUTOR_Profile,
  authenticateJwt,
  tutorController.getProfile
);

export { router as tutorRouter };
