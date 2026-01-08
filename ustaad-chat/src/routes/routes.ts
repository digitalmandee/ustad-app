export default {
  CREATE_MESSAGE: '/chat/messages',
  GET_MESSAGES: '/chat/messages/conversation/:conversationId',
  UPDATE_MESSAGE: '/chat/messages/:messageId',
  DELETE_MESSAGE: '/chat/messages/:messageId',
  MARK_READ_MESSAGE: '/chat/messages/conversation/:conversationId/read/:messageId',
  CREATE_CONVERSATION: '/chat/conversations',
  GET_ALL_CONVERSATION: '/chat/conversations',
  GET_ID_CONVERSATION: '/chat/conversations/:conversationId',
  MARK_CONVERSATION_READ: '/chat/conversations/:conversationId/read',
  BULK_DELETE_MESSAGES: '/chat/messages/bulk-delete',
  DELETE_CONVERSATION: '/chat/conversations/:conversationId',
  BULK_DELETE_CONVERSATIONS: '/chat/conversations/bulk-delete',

  SAVE_FILE: '/chat/files/upload',
  GET_FILE: '/chat/files/:fileId',
  DELETE_FILE: '/chat/files/:fileId',
};
