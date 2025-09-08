import express from 'express';
import ChatController from './file.controller';
import {
  getFileValidator,
  saveFileValidator,
} from './file.validators';
import { validateRequest } from '../../middlewares';
import { authenticateJwt } from '../../middlewares/auth';
import routes from '../../routes/routes';
import { uploader } from '../../middlewares/multer';
import FileController from './file.controller';

const router = express.Router();
const fileController = new FileController();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chat service is running',
    timestamp: new Date().toISOString()
  });
});

router.post(
  routes.SAVE_FILE,
   uploader.single("file"),
  authenticateJwt,
  saveFileValidator(),
  validateRequest,
  fileController.saveFile
);

router.get(
  routes.GET_FILE,
  authenticateJwt,
  getFileValidator(),
  validateRequest,
  fileController.getFile
);



export { router as fileRouter };
