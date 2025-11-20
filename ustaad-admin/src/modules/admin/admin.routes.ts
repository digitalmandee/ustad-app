import express from "express";
import AdminController from "./admin.controller";
import { validateRequest } from "../../middlewares";
import multer from "multer";
import routes from "../../routes/routes";
import { authenticateJwt } from "../../middlewares/auth";
import { Router } from 'express';
import { authorizeRoles } from "../../middlewares/role-auth";

const adminController = new AdminController();
const router = Router();

const upload = multer({ storage: multer.memoryStorage() });
const uploadFields = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "idFront", maxCount: 1 },
  { name: "idBack", maxCount: 1 },
]);

// Stats
router.get(
  routes.STATS,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.getStats
);

// Parents
router.get(
  routes.PARENTS,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.getAllParents
);

router.get(
  routes.PARENT_BY_ID,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.getParentById
);

// Tutors
router.get(
  routes.TUTORS,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.getAllTutors
);

router.get(
  routes.TUTOR_BY_ID,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.getTutorById
);

// Payment Requests
router.get(
  routes.PAYMENT_REQUESTS,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.getAllPaymentRequests
);

router.get(
  routes.PAYMENT_REQUEST_BY_ID,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.getPaymentRequestById
);

router.put(
  routes.PAYMENT_REQUEST_STATUS,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.updatePaymentRequestStatus
);

// Admin user management
router.post(
  routes.CREATE_ADMIN,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN"),
  adminController.createAdmin
);

router.get(
  routes.GET_ALL_ADMINS,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN"),
  adminController.getAllAdmins
);

router.delete(
  routes.DELETE_ADMIN,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN"),
  adminController.deleteAdmin
);

// Get pending onboard users
router.get(
  routes.PENDING_ONBOARD_USERS,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN" ),
  adminController.getPendingOnboardUsers
);

// Approve user onboarding
router.put(
  routes.APPROVE_ONBOARDING,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.approveOnboarding
);

// Contract dispute management
router.get(
  routes.DISPUTED_CONTRACTS,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.getDisputedContracts
);

router.put(
  routes.RESOLVE_DISPUTE,
  authenticateJwt,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  adminController.resolveDispute
);

export { router as adminRouter };
