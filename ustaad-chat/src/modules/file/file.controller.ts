import { Request, Response } from 'express';
import FileService from './file.service';
import { GenericError } from '../../errors/generic-error';
import { sendSuccessResponse } from '../../helper/response';
import InfoMessages from '../../constant/messages';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError } from '../../errors/bad-request-error';

export default class FileController {
  private fileService = new FileService();

  saveFile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(req.user, 'req.user', req.file, 'req.file', req.body, 'req.body');
      const userId = req.user.id;
      const fileMetaData = req.file;
      const duration = req.body.duration;
      // 🚨 If no file is uploaded
      if (!fileMetaData) {
        throw new BadRequestError('File is required');
      }

      const { conversationId } = req.body;
      let data = await this.fileService.saveFile(userId, fileMetaData, conversationId, duration);
      sendSuccessResponse(res, InfoMessages.GENERIC.ITEM_CREATED_SUCCESSFULLY('file'), 200, data);
    } catch (e: any) {
      throw new GenericError(e, ` Error from saving file ${__filename}`);
    }
  };

  getFile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fileId } = req.params;
      const userId = req.user.id;

      const files = await this.fileService.getFile(userId, fileId as string);

      sendSuccessResponse(res, 'File retrieved successfully', 200, files);
    } catch (e: any) {
      throw new GenericError(e, ` Error from fetching files ${__filename}`);
    }
  };
}
