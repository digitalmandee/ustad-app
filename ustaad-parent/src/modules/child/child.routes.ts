import express from "express";
import { ChildController } from "./child.controller";
import { validateRequest } from "../../middlewares";
import { authenticateJwt } from "../../middlewares/auth";
import routes from "../../routes/routes";
import { addChildValidationRules } from "./child.validators";
import { Router } from 'express';
import { authorizeRoles } from "../../middlewares/role-auth";

const childController = new ChildController();
const router = Router();

router.post(
  routes.CHILD_CREATE,
  authenticateJwt,
  addChildValidationRules(),
  validateRequest,
  authorizeRoles("PARENT"),
  childController.createChild
);

router.put(
  routes.CHILD_UPDATE,
  authenticateJwt,
  addChildValidationRules(),
  validateRequest,
  authorizeRoles("PARENT"),
  childController.updateChild
);

router.delete(
  routes.CHILD_DELETE,
  authenticateJwt,
  validateRequest,
  authorizeRoles("PARENT"),
  childController.deleteChild
);

router.get(
  routes.CHILD_GET_ALL,
  authenticateJwt,
  authorizeRoles("PARENT"),
  childController.getChildren
);

router.get(
  routes.CHILD_GET_ONE,
  authenticateJwt,
  authorizeRoles("PARENT"),
  childController.getChild
);

router.get(routes.CHILD_GET_NOTES, authenticateJwt, authorizeRoles("PARENT"), childController.getChildNotesByChildId.bind(childController));

router.get(routes.CHILD_GET_REVIEWS, authenticateJwt, authorizeRoles("PARENT"), childController.getChildReviewsByChildId.bind(childController));

export  { router as childRouter }; 