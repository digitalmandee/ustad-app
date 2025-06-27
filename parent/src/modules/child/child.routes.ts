import express from "express";
import { ChildController } from "./child.controller";
import { validateRequest } from "../../middlewares";
import { authenticateJwt } from "../../middlewares/auth";
import routes from "../../routes/routes";
import { addChildValidationRules } from "./child.validators";

const childController = new ChildController();
const router = express.Router();

router.post(
  routes.CHILD_CREATE,
  authenticateJwt,
  addChildValidationRules(),
  validateRequest,
  childController.createChild
);

router.put(
  routes.CHILD_UPDATE,
  authenticateJwt,
  addChildValidationRules(),
  validateRequest,
  childController.updateChild
);

router.delete(
  routes.CHILD_DELETE,
  authenticateJwt,
  validateRequest,
  childController.deleteChild
);

router.get(
  routes.CHILD_GET_ALL,
  authenticateJwt,
  childController.getChildren
);

router.get(
  routes.CHILD_GET_ONE,
  authenticateJwt,
  childController.getChild
);

export { router as childRouter }; 