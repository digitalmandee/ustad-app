import express from "express";
import TutorController from "./tutor.controller";
import { validateRequest } from "../../middlewares";
import multer from "multer";
import {
  tutorOnboardingValidationRules,
  editProfileValidationRules,
  experienceValidationRules,
  educationValidationRules,
} from "./tutor.validators";
import routes from "../../routes/routes";
import { authenticateJwt } from "../../middlewares/auth";

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

router.get(routes.TUTOR_Profile, authenticateJwt, tutorController.getProfile);

// Experience routes
router.get(
  routes.ALL_EXPERIENCE,
  authenticateJwt,
  tutorController.allExperience
);
router.post(
  routes.ADD_EXPERIENCE,
  authenticateJwt,
  experienceValidationRules(),
  validateRequest,
  tutorController.addExperience
);

router.post(
  routes.EDIT_EXPERIENCE,
  authenticateJwt,
  experienceValidationRules(),
  validateRequest,
  tutorController.updateExperience
);

router.get(
  routes.DELETE_EXPERIENCE,
  authenticateJwt,
  tutorController.deleteExperience
);

// Education routes
router.get(routes.ALL_EDUCATION, authenticateJwt, tutorController.allEducation);

router.post(
  routes.ADD_EDUCATION,
  authenticateJwt,
  educationValidationRules(),
  validateRequest,
  tutorController.addEducation
);

router.post(
  routes.EDIT_EDUCATION,
  authenticateJwt,
  educationValidationRules(),
  validateRequest,
  tutorController.updateEducation
);

router.get(
  routes.DELETE_EDUCATION,
  authenticateJwt,
  tutorController.deleteEducation
);

// About routes
router.post(
  routes.ADD_TUTOR_ABOUT,
  authenticateJwt,
  tutorController.addAbout
);

router.post(
  routes.EDIT_TUTOR_ABOUT,
  authenticateJwt,
  tutorController.editAbout
);

export { router as tutorRouter };
