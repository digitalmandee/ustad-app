import { body, query } from 'express-validator';
import { ConversationType } from '../../constant/enums';
import { UserRole } from '../../constant/enums';
import { MessageType } from '../../constant/enums';
import { param } from 'express-validator';


export const saveFileValidator =()=>{
  return [
  body('conversationId')
    .exists().withMessage('conversationId is required')
    .bail()
    .isUUID().withMessage('conversationId must be a valid UUID'),]
} 

export const getFileValidator =()=>{
  return [
  param('fileId')
    .optional()
    .isUUID().withMessage('fileId must be a valid UUID'),]
} 
