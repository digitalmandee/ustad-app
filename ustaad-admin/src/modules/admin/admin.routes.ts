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
  authorizeRoles("ADMIN"),
  adminController.getStats
);

// Parents
router.get(
  routes.PARENTS,
  authenticateJwt,
  authorizeRoles("ADMIN"),
  adminController.getAllParents
);

router.get(
  routes.PARENT_BY_ID,
  authenticateJwt,
  authorizeRoles("ADMIN"),
  adminController.getParentById
);

// Tutors
router.get(
  routes.TUTORS,
  authenticateJwt,
  authorizeRoles("ADMIN"),
  adminController.getAllTutors
);

router.get(
  routes.TUTOR_BY_ID,
  authenticateJwt,
  authorizeRoles("ADMIN"),
  adminController.getTutorById
);

export { router as adminRouter };
