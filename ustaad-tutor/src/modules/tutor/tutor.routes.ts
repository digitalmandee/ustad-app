import express from "express";
import TutorController from "./tutor.controller";
import { validateRequest } from "../../middlewares";
import multer from "multer";
import {
  tutorOnboardingValidationRules,
  editProfileValidationRules,
  experienceValidationRules,
  educationValidationRules,
  tutorSettingsValidationRules,
  tutorLocationValidationRules,
  paymentRequestValidationRules,
  tutorSearchByLocationValidationRules
} from "./tutor.validators";
import routes from "../../routes/routes";
import { authenticateJwt } from "../../middlewares/auth";
import { Router } from 'express';
import { authorizeRoles } from "../../middlewares/role-auth";

const tutorController = new TutorController();
const router = Router();

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
  authorizeRoles("TUTOR"),
  tutorController.onboardTutor
);

router.post(
  routes.TUTOR_Profile_EDIT,
  authenticateJwt,
  editProfileValidationRules(),
  validateRequest,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.editProfile
);

router.get(routes.TUTOR_Profile, authenticateJwt, authorizeRoles("TUTOR"), tutorController.getProfile);

// Experience routes
router.get(
  routes.ALL_EXPERIENCE,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.allExperience
);
router.post(
  routes.ADD_EXPERIENCE,
  authenticateJwt,
  experienceValidationRules(),
  validateRequest,
  authorizeRoles("TUTOR"),
  tutorController.addExperience
);

router.post(
  routes.EDIT_EXPERIENCE,
  authenticateJwt,
  experienceValidationRules(),
  validateRequest,
  authorizeRoles("TUTOR"),
  tutorController.updateExperience
);

router.get(
  routes.DELETE_EXPERIENCE,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.deleteExperience
);

// Education routes
router.get(routes.ALL_EDUCATION, authenticateJwt, authorizeRoles("TUTOR"), tutorController.allEducation);

router.post(
  routes.ADD_EDUCATION,
  authenticateJwt,
  educationValidationRules(),
  validateRequest,
  authorizeRoles("TUTOR"),
  tutorController.addEducation
);

router.post(
  routes.EDIT_EDUCATION,
  authenticateJwt,
  educationValidationRules(),
  validateRequest,
  authorizeRoles("TUTOR"),
  tutorController.updateEducation
);

router.get(
  routes.DELETE_EDUCATION,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.deleteEducation
);

// About routes
router.post(routes.ADD_TUTOR_ABOUT, authenticateJwt, authorizeRoles("TUTOR"),       tutorController.addAbout);

router.post(
  routes.EDIT_TUTOR_ABOUT,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.editAbout
);

router.post(
  routes.SET_TUTOR_SUBJECT_SETTINGS,
  authenticateJwt,
  tutorSettingsValidationRules(),
  validateRequest,
  authorizeRoles("TUTOR"),
  tutorController.setTutorSettings
);
router.get(
  routes.GET_TUTOR_SUBJECT_SETTINGS,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.getTutorSettings
);
router.put(
  routes.UPDATE_TUTOR_SUBJECT_SETTINGS,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.updateTutorSettings
);

router.post(routes.ADD_CHILD_NOTE, authenticateJwt, authorizeRoles("TUTOR"), tutorController.addChildNote);
router.post(routes.ADD_CHILD_REVIEW, authenticateJwt,authorizeRoles("TUTOR"),tutorController.addChildReview);

router.post(
  routes.TUTOR_LOCATION,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorLocationValidationRules(),
  validateRequest,
  tutorController.addTutorLocation
);

router.get(
  routes.TUTOR_LOCATION,
  authenticateJwt,
  tutorSearchByLocationValidationRules(),
  validateRequest,
  authorizeRoles("TUTOR", "PARENT"),
  tutorController.findTutorsByLocation
);

// Payment Request routes
router.post(
  routes.ADD_PAYMENT_REQUEST,
  authenticateJwt,
  paymentRequestValidationRules(),
  validateRequest,
  authorizeRoles("TUTOR"),
  tutorController.createPaymentRequest
);

router.get(
  routes.GET_PAYMENT_REQUESTS,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.getPaymentRequests
);

export  {router as tutorRouter};
