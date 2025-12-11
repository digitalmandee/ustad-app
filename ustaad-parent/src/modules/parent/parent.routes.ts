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
import { Router } from "express";
import ParentController from "./parent.controller";
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

router.get(
  routes.PARENT_Profile,
  authenticateJwt,
  authorizeRoles("PARENT", "TUTOR"),
  tutorController.getProfile
);

router.get(
  routes.PARENT_PAYMENT_METHODS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.getPaymentMethods
);


router.patch(
  routes.OFFER_UPDATE_STATUS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  validateRequest,
  parentController.updateOffer
);

router.get(
  routes.GET_TUTOR_PROFILE,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.getTutorProfile
);

// Subscription routes
router.get(
  routes.GET_ALL_SUBSCRIPTIONS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.getAllSubscriptions
);

router.post(
  routes.CANCEL_PARENT_SUBSCRIPTION,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.cancelSubscription
);

// Tutor review route
// router.post(
//   routes.ADD_TUTOR_REVIEW,
//   authenticateJwt,
//   authorizeRoles("PARENT"),
//   parentController.createTutorReview
// );

// Analytics routes
router.get(
  routes.MONTHLY_SPENDING,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.getMonthlySpending
);

// Contract termination and completion routes
router.get(
  routes.GET_ACTIVE_CONTRACTS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.getActiveContractsForDispute
);

router.post(
  routes.TERMINATE_CONTRACT,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.terminateContract
);

router.post(
  routes.SUBMIT_CONTRACT_RATING,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.submitContractRating
);


// PayFast routes
router.post(
  routes.PAYFAST_SUBSCRIPTION_INITIATE,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.initiatePayFastSubscription
);

// PayFast IPN endpoint (no authentication - called by PayFast server)
router.post(
  routes.PAYFAST_IPN,
  parentController.handlePayFastIPN
);

router.get(
  routes.SUBSCRIPTION_STATUS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.getSubscriptionStatus
);

router.post(
  routes.SUBSCRIPTION_CHARGE,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.chargeRecurringSubscription
);

// PayFast Tokenization routes
router.get(
  routes.PAYFAST_GET_INSTRUMENTS,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.getListsOfInstruments
);

router.post(
  routes.PAYFAST_RECURRING_OTP,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.recurringTransactionOTP
);

router.post(
  routes.PAYFAST_INITIATE_RECURRING,
  authenticateJwt,
  authorizeRoles("PARENT"),
  parentController.initiateRecurringPayment
);

// PayFast Success Callback (no authentication - called by PayFast redirect)
router.get(
  routes.PAYFAST_SUCCESS,
  parentController.handlePayFastSuccess
);

export { router as tutorRouter };
