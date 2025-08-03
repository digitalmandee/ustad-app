import { body, query } from 'express-validator';
import { ConversationType } from '../../constant/enums';
import { UserRole } from '../../constant/enums';
import { MessageType } from '../../constant/enums';
import { param } from 'express-validator';


export const createConversationValidator =() => {
  return [
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('type')
    .isString()
    .isIn(Object.values(ConversationType))
    .withMessage(`type must be one of ${Object.values(ConversationType).join(', ')}`),
  body('participantIds')
    .isArray({ min: 1 })
    .withMessage('participantIds must be a non-empty array')
    .custom((arr) => arr.every((id: string) => /^[0-9a-fA-F-]{36}$/.test(id)))
    .withMessage('Each participantId must be a valid UUID'),
  body('isPrivate').optional().isBoolean(),
  body('maxParticipants').optional().isInt({ min: 2, max: 1000 }),
];
}

// export const updateConversationValidator = () => {
//   return [
//   body('name').optional().isString().isLength({ min: 1, max: 100 }),
//   body('description').optional().isString().isLength({ max: 500 }),
//   body('isPrivate').optional().isBoolean(),
//   body('maxParticipants').optional().isInt({ min: 2, max: 1000 }),
// ];
// }

// export const joinConversationValidator =() => {
//   return [
//   body('userId')
//     .isUUID()
//     .withMessage('userId must be a valid UUID'),
//   body('role')
//     .optional()
//     .isIn(['admin', 'moderator', 'member']) // or use Object.values(UserRole)
//     .withMessage(`role must be one of: admin, moderator, member`),
// ];
// }



// Create Message Validator
export const createMessageValidator = ()=>{
  return [
  body('conversationId')
    .exists().withMessage('conversationId is required')
    .bail()
    .isUUID().withMessage('conversationId must be a valid UUID'),
  body('content')
    .exists().withMessage('Message content is required')
    .bail()
    .isString().isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  body('type')
    .optional()
    .isString()
    .isIn(Object.values(MessageType))
    .withMessage(`Type must be one of: ${Object.values(MessageType).join(', ')}`),
  body('replyToId')
    .optional()
    .isUUID().withMessage('replyToId must be a valid UUID'),
  body('metadata')
    .optional()
    .isObject().withMessage('metadata must be an object'),


        // Conditional validation of OFFER ONLY if type === 'OFFER'
    body('offer')
      .if(body('type').equals('OFFER'))  // Only validate OFFER if type is 'OFFER'
      .exists().withMessage('offer is required when type is OFFER')
      .bail()
      .isObject().withMessage('offer must be an object'),

    body('offer.receiverId')
      .if(body('type').equals('OFFER'))
      .exists().withMessage('offer.receiverId is required')
      .bail()
      .isUUID().withMessage('offer.receiverId must be a valid UUID'),

    body('offer.childName')
      .if(body('type').equals('OFFER'))
      .exists().withMessage('offer.childName is required')
      .bail()
      .isString().withMessage('offer.childName must be a string')
      .notEmpty().withMessage('offer.childName cannot be empty'),

    body('offer.amountMonthly')
      .if(body('type').equals('OFFER'))
      .exists().withMessage('offer.amountMonthly is required')
      .bail()
      .isDecimal({ decimal_digits: '0,2' }).withMessage('offer.amountMonthly must be a decimal number with up to 2 decimal places'),

    body('offer.subject')
      .if(body('type').equals('OFFER'))
      .exists().withMessage('offer.subject is required')
      .bail()
      .isString().withMessage('offer.subject must be a string')
      .notEmpty().withMessage('offer.subject cannot be empty'),

    body('offer.startDate')
      .if(body('type').equals('OFFER'))
      .exists().withMessage('offer.startDate is required')
      .bail()
      .isISO8601().toDate().withMessage('offer.startDate must be a valid date'),

    body('offer.startTime')
      .if(body('type').equals('OFFER'))
      .exists().withMessage('offer.startTime is required')
      .bail()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('offer.startTime must be a valid time in HH:MM format'),

    body('offer.endTime')
      .if(body('type').equals('OFFER'))
      .exists().withMessage('offer.endTime is required')
      .bail()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('offer.endTime must be a valid time in HH:MM format')
      .custom((endTime, { req }) => {
        const startTime = req.body.offer?.startTime;
        if (startTime && endTime <= startTime) {
          throw new Error('endTime must be after startTime');
        }
        return true;
      }),

    body('offer.description')
      .if(body('type').equals('OFFER'))
      .optional()
      .isString().withMessage('offer.description must be a string'),

];
}

// Update Message Validator
export const updateMessageValidator = ()=>{
  return [
  body('content')
    .optional()
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  body('metadata')
    .optional()
    .isObject().withMessage('metadata must be an object'),
  // Controller or custom middleware should check that at least one field is provided
];
}

// Get Messages Validator (Query Params)
export const getMessagesValidator =()=>{
  return [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be an integer >= 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
];
}



export const deleteMessageValidator = () => [
  param('messageId')
    .isUUID()
    .withMessage('messageId must be a valid UUID'),
];

export const markAsReadValidator = () => [
  param('conversationId')
    .isUUID()
    .withMessage('conversationId must be a valid UUID'),
  param('messageId')
    .isUUID()
    .withMessage('messageId must be a valid UUID'),
];