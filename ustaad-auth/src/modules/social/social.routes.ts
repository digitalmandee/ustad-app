import express from 'express';
import routes from '../../routes/routes';
import SocialController from './social.controller';
import { authenticateJwt } from '../../middlewares/auth';

const router = express.Router();
const socialController = new SocialController();

router.post(
  routes.REPORT_USER,
  authenticateJwt,
  socialController.reportUser
);

router.post(
  routes.BLOCK_USER,
  authenticateJwt,
  socialController.blockUser
);

router.delete(
  routes.UNBLOCK_USER,
  authenticateJwt,
  socialController.unblockUser
);

router.get(
  routes.GET_BLOCKED_USERS,
  authenticateJwt,
  socialController.getBlockedUsers
);

export { router as socialRouter };
