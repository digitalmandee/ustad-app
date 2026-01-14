import { Request, Response } from 'express';
import ChatService from './chat.service';
import { GenericError } from '../../errors/generic-error';
import { sendSuccessResponse } from '../../helper/response';
import InfoMessages from '../../constant/messages';
import { AuthenticatedRequest } from '../../middlewares/auth';

import { Socket } from 'socket.io';
import { ICreateMessageDto } from './chat.dto';

export default class ChatController {
  private chatService = new ChatService();

  createMessage = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const senderId = req.user.id;
      const role = req.user.role;
      const messageData = req.body;
      let user = await this.chatService.createMessage(senderId, messageData, role);
      sendSuccessResponse(
        res,
        InfoMessages.GENERIC.ITEM_CREATED_SUCCESSFULLY('message'),
        200,
        user
      );
    } catch (e: any) {
      throw new GenericError(e, ` Error from create message ${__filename}`);
    }
  };

  getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await this.chatService.getMessages(conversationId, userId, page, limit);
      sendSuccessResponse(res, 'got message sucessfully', 200, result);
    } catch (e: any) {
      throw new GenericError(e, ` Error from create message ${__filename}`);
    }
  };

  updateMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      const { messageId } = req.params;
      const message = await this.chatService.updateMessage(messageId, userId, req.body);

      sendSuccessResponse(res, 'updated messages sucessfully', 200, message);
    } catch (e: any) {
      throw new GenericError(e, ` Error from create message ${__filename}`);
    }
  };

  deleteMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      const { messageId } = req.params;
      const message = await this.chatService.deleteMessage(messageId, userId);
      sendSuccessResponse(res, 'updated messages sucessfully', 200, message);
    } catch (e: any) {
      throw new GenericError(e, ` Error from create message ${__filename}`);
    }
  };

  markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      const { conversationId, messageId } = req.params;
      const message = await this.chatService.markAsRead(conversationId, userId, messageId);
      sendSuccessResponse(res, 'updated messages sucessfully', 200, message);
    } catch (e: any) {
      throw new GenericError(e, ` Error from create message ${__filename}`);
    }
  };

  /////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////      conversion          /////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////

  createConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const conversation = await this.chatService.createConversation(userId, req.body);
      sendSuccessResponse(res, 'coversation created sucessfully', 200, conversation);
    } catch (e: any) {
      throw new GenericError(e, ` Error from create message ${__filename}`);
    }
  };

  getUserConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await this.chatService.getUserConversations(userId, page, limit);
      sendSuccessResponse(res, 'user conversations got successfully', 200, result);
    } catch (e: any) {
      throw new GenericError(e, ` Error from get user conversations ${__filename}`);
    }
  };

  getConversationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const { conversationId } = req.params;
      const conversation = await this.chatService.getConversationById(conversationId, userId, role);
      sendSuccessResponse(res, 'user coversation got by id sucessfully', 200, conversation);
    } catch (e: any) {
      throw new GenericError(e, ` Error from create message ${__filename}`);
    }
  };

  //   updateConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  //   try {
  //     const userId = req.user?.id;

  //     const { conversationId } = req.params;
  //     const conversation = await this.chatService.updateConversation(conversationId, userId, req.body);
  //     sendSuccessResponse(res,"updated coversation  sucessfully", 200, conversation);

  //   } catch (e:any) {
  //     throw new GenericError(e, ` Error from create message ${__filename}`);
  //   }
  // };

  //   joinConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  //   try {
  //     const { conversationId } = req.params;
  //    const conversation= await this.chatService.joinConversation(conversationId, req.body);
  //     sendSuccessResponse(res,"coversation joined sucessfully", 200, conversation);

  //   } catch (e:any) {
  //     throw new GenericError(e, ` Error from create message ${__filename}`);
  //   }
  // };

  // leaveConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  //   try {
  //     const userId = req.user?.id;

  //     const { conversationId } = req.params;
  //     const conversation=await this.chatService.leaveConversation(conversationId, userId);
  //     sendSuccessResponse(res,"coversation left sucessfully", 200, conversation);

  //   } catch (e:any) {
  //     throw new GenericError(e, ` Error from create message ${__filename}`);
  //   }
  // };

  bulkDeleteMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { messageIds } = req.body;
      await this.chatService.bulkDeleteMessages(messageIds, userId);
      sendSuccessResponse(res, 'Messages deleted successfully', 200);
    } catch (e: any) {
      throw new GenericError(e, ` Error from bulk delete messages ${__filename}`);
    }
  };

  deleteConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;
      await this.chatService.deleteConversation(conversationId, userId);
      sendSuccessResponse(res, 'Conversation deleted successfully', 200);
    } catch (e: any) {
      throw new GenericError(e, ` Error from delete conversation ${__filename}`);
    }
  };

  bulkDeleteConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { conversationIds } = req.body;
      await this.chatService.bulkDeleteConversations(conversationIds, userId);
      sendSuccessResponse(res, 'Conversations deleted successfully', 200);
    } catch (e: any) {
      throw new GenericError(e, ` Error from bulk delete conversations ${__filename}`);
    }
  };

  markConversationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;
      await this.chatService.markConversationAsRead(conversationId, userId);
      sendSuccessResponse(res, 'Conversation marked as read successfully', 200);
    } catch (e: any) {
      throw new GenericError(e, ` Error from mark conversation as read ${__filename}`);
    }
  };

  /////////////////  sockets     ///////////////////////////////////

  handleJoinConversation = async (socket: Socket, conversationId: string) => {
    socket.join(conversationId);
    console.log(`User joined conversation ${conversationId}`);
  };

  handleSendMessage = async (socket: Socket, data: ICreateMessageDto) => {
    const senderId = socket.data.user.user.id;
    const role = socket.data.user.user.role;
    console.log(senderId, 'sender id', data, 'data');

    try {
      const savedMessage = await this.chatService.createMessage(senderId, data, role);
      socket.to(data.conversationId).emit('newMessage', savedMessage);

      console.log('savedMessage', savedMessage);

      socket.emit('newMessage', savedMessage);
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('error', 'Failed to send/save message');
    }
  };

  markAsReadS = async (socket: Socket, data: string) => {
    const senderId = socket.data.user.user.id;
    console.log(senderId, 'sender id', data, 'data');

    try {
      const lastRead = await this.chatService.markAsReadS(senderId, data);
      socket.to(data).emit(`${senderId} lastRead`, lastRead);
      socket.emit('Your lastRead', lastRead);
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('error', 'Failed to send/save message');
    }
  };

  handleGetMissedMessages = async (socket: Socket, lastSeenAt: string | Date) => {
    const userId = socket.data.user.user.id;
    try {
      const missedMessages = await this.chatService.getMissedMessages(userId, lastSeenAt);
      socket.emit('missedMessages', missedMessages);
    } catch (err) {
      console.error('Error fetching missed messages:', err);
      socket.emit('error', 'Failed to fetch messages');
    }
  };

  handleDeleteMessageS = async (socket: Socket, messageId: string) => {
    const userId = socket.data.user.user.id;
    try {
      const deletedMessage = await this.chatService.deleteMessageS(messageId, userId);
      socket.to(deletedMessage.conversationId).emit('messageDeleted', {
        messageId: deletedMessage.id,
        senderId: userId,
      });
      socket.emit('messageDeleted', {
        messageId: deletedMessage.id,
        senderId: userId,
      });
    } catch (err) {
      console.error('Error deleting message via socket:', err);
      socket.emit('error', 'Failed to delete message');
    }
  };
}
