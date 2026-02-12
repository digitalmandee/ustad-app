import express from 'express';
import ChatController from './chat.controller';
import {
  createConversationValidator,
  createMessageValidator,
  deleteMessageValidator,
  getMessagesValidator,
  conversationIdParamValidator,
  markConversationAsReadValidator,
  deleteConversationValidator,
  bulkDeleteMessagesValidator,
  bulkDeleteConversationsValidator,
  // joinConversationValidator,
  markAsReadValidator,
  // updateConversationValidator,
  updateMessageValidator,
} from './chat.validators';
import { validateRequest } from '../../middlewares';
import { authenticateJwt } from '../../middlewares/auth';
import routes from '../../routes/routes';

const router = express.Router();
const chatController = new ChatController();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chat service is running',
    timestamp: new Date().toISOString(),
  });
});

/* User or consultant signup Route with email or phone */
router.post(
  routes.CREATE_MESSAGE,
  // '/messages',
  authenticateJwt,
  // createMessageValidator(),
  validateRequest,
  chatController.createMessage
);

router.get(
  routes.GET_MESSAGES,
  // '/messages/conversation/:conversationId',
  authenticateJwt,
  conversationIdParamValidator(),
  getMessagesValidator(),
  validateRequest,
  chatController.getMessages
);
router.put(
  routes.UPDATE_MESSAGE,
  // '/messages/:messageId',
  authenticateJwt,
  deleteMessageValidator(),
  updateMessageValidator(),
  validateRequest,
  chatController.updateMessage
);
router.delete(
  routes.DELETE_MESSAGE,
  // '/messages/:messageId',
  authenticateJwt,
  deleteMessageValidator(),
  validateRequest,
  chatController.deleteMessage
);

router.post(
  routes.MARK_READ_MESSAGE,
  // '/messages/conversation/:conversationId/read/:messageId',
  authenticateJwt,
  markAsReadValidator(),
  validateRequest,
  chatController.markAsRead
);

// conversation

router.post(
  routes.CREATE_CONVERSATION,
  // '/conversations',
  authenticateJwt,
  createConversationValidator(),
  validateRequest,
  chatController.createConversation
);

router.get(
  routes.GET_ALL_CONVERSATION,
  authenticateJwt,
  getMessagesValidator(),
  validateRequest,
  chatController.getUserConversations
);

router.get(
  routes.GET_ID_CONVERSATION,
  // '/conversations/:conversationId',
  authenticateJwt,
  conversationIdParamValidator(),
  validateRequest,
  chatController.getConversationById
);

// router.put(
//   '/conversations/:conversationId',
//   authenticateJwt,
//   updateConversationValidator(),
//   validateRequest,
//   chatController.updateConversation
// );

// router.post(
//   '/conversations/:conversationId/join',
//   authenticateJwt,
//   joinConversationValidator(),
//   validateRequest,
//   chatController.joinConversation
// );

// router.post(
//   'conversations/:conversationId/leave',
//   authenticateJwt,
//   // getMessagesValidator(),
//   // validateRequest,
//   chatController.leaveConversation
// );

// Bulk delete messages
router.post(
  routes.BULK_DELETE_MESSAGES,
  authenticateJwt,
  bulkDeleteMessagesValidator(),
  validateRequest,
  chatController.bulkDeleteMessages
);

// Delete conversation
router.delete(
  routes.DELETE_CONVERSATION,
  authenticateJwt,
  conversationIdParamValidator(),
  validateRequest,
  chatController.deleteConversation
);

// Mark conversation as read
router.patch(
  routes.MARK_CONVERSATION_READ,
  authenticateJwt,
  conversationIdParamValidator(),
  validateRequest,
  chatController.markConversationAsRead
);

// Bulk delete conversations
router.post(
  routes.BULK_DELETE_CONVERSATIONS,
  authenticateJwt,
  bulkDeleteConversationsValidator(),
  validateRequest,
  chatController.bulkDeleteConversations
);

export { router as chatRouter };
