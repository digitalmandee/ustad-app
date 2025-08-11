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

router.post(
  validateRequest,
  authenticateJwt,
  authorizeRoles("ADMIN"),
);


export  {router as adminRouter};
