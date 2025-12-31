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
  tutorSearchByLocationValidationRules,
  helpRequestValidationRules,
  childNoteValidationRules,
  updateBankDetailsValidationRules,
} from "./tutor.validators";
import routes from "../../routes/routes";
import { authenticateJwt } from "../../middlewares/auth";
import { Router } from "express";
import { authorizeRoles } from "../../middlewares/role-auth";

const tutorController = new TutorController();
const router = Router();

const upload = multer({ storage: multer.memoryStorage() });
const uploadFields = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "idFront", maxCount: 1 },
  { name: "idBack", maxCount: 1 },
]);

const uploadEducation = upload.fields([{ name: "degree", maxCount: 1 }]);

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

router.get(
  routes.TUTOR_Profile,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.getProfile
);

router.put(
  routes.UPDATE_BANK_DETAILS,
  authenticateJwt,
  updateBankDetailsValidationRules(),
  validateRequest,
  authorizeRoles("TUTOR"),
  tutorController.updateBankDetails
);

router.get(
  routes.GET_PARENT_PROFILE,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.getParentProfile
);

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
router.get(
  routes.ALL_EDUCATION,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.allEducation
);

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
router.post(
  routes.ADD_TUTOR_ABOUT,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.addAbout
);

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

router.post(
  routes.ADD_CHILD_NOTE,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  childNoteValidationRules(),
  validateRequest,
  tutorController.addChildNote
);
router.post(
  routes.ADD_CHILD_REVIEW,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.addChildReview
);

router.get(
  routes.GET_TUTORS_LOCATIONS,
  authenticateJwt,
  // tutorSearchByLocationValidationRules(),
  validateRequest,
  authorizeRoles("TUTOR", "PARENT"),
  tutorController.findTutorsByLocation
);
router.post(
  routes.TUTOR_LOCATION,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorLocationValidationRules(),
  validateRequest,
  tutorController.addTutorLocation
);

// Get all tutor locations
router.get(
  routes.TUTOR_LOCATION,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.getAllTutorLocations
);

// Delete tutor location
router.delete(
  routes.TUTOR_LOCATION,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.deleteTutorLocation
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

// Tutor Sessions routes
router.get(
  routes.GET_TUTOR_SESSIONS,
  authenticateJwt,
  authorizeRoles("TUTOR", "PARENT"),
  tutorController.getTutorSessions
);
router.get(
  routes.GET_TUTOR_SESSION,
  authenticateJwt,
  authorizeRoles("TUTOR", "PARENT"),
  tutorController.getTutorSession
);
router.post(
  routes.ADD_TUTOR_SESSION,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.addTutorSession
);
router.delete(
  routes.DELETE_TUTOR_SESSION,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.deleteTutorSession
);
router.put(
  routes.EDIT_TUTOR_SESSION,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.editTutorSession
);

// Analytics routes
router.get(
  routes.MONTHLY_EARNINGS,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.getMonthlyEarnings
);

// Help Request routes
router.post(
  routes.HELP_REQUEST,
  authenticateJwt,
  authorizeRoles("TUTOR", "PARENT"),
  helpRequestValidationRules(),
  validateRequest,
  tutorController.createHelpRequest
);

router.get(
  routes.GET_HELP_REQUESTS,
  authenticateJwt,
  authorizeRoles("TUTOR", "PARENT"),
  tutorController.getHelpRequestsAgainstMe
);

// Contracts routes
// router.get(
//   routes.GET_CONTRACTS,
//   authenticateJwt,
//   authorizeRoles("TUTOR", "PARENT"),
//   tutorController.getContracts
// );

router.get(
  routes.GET_ACTIVE_CONTRACTS,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.getActiveContractsForDispute
);

router.patch(
  routes.CANCEL_CONTRACT,
  authenticateJwt,
  authorizeRoles("TUTOR", "PARENT"),
  tutorController.cancelContract
);

router.post(
  routes.TERMINATE_CONTRACT,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.terminateContract
);

router.post(
  routes.SUBMIT_CONTRACT_RATING,
  authenticateJwt,
  authorizeRoles("TUTOR"),
  tutorController.submitContractRating
);

router.post(
  routes.HELP_REQUEST_CONTRACT,
  authenticateJwt,
  authorizeRoles("TUTOR", "PARENT"),
  helpRequestValidationRules(),
  validateRequest,
  tutorController.createHelpRequestAgainstContract
);

// Notifications routes
router.get(
  routes.NOTIFICATION_HISTORY,
  authenticateJwt,
  authorizeRoles("TUTOR", "PARENT"),
  tutorController.getNotificationHistory
);
router.put(
  routes.NOTIFICATION_READ,
  authenticateJwt,
  authorizeRoles("TUTOR", "PARENT"),
  tutorController.markNotificationAsRead
);

export { router as tutorRouter };
