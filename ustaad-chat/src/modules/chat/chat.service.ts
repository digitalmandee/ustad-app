import { Service } from 'typedi';
import { GenericError } from '../../errors/generic-error';
import { Op } from 'sequelize';
// import { Message } from '../../models/message.model';
// import { ConversationParticipant } from '../../models/conversation_participant.model';
import {
  ICreateMessageDto,
  IUpdateMessageDto,
  IMessageResponseDto,
  PaginatedMessagesDto,
  CreateConversationDto,
  ConversationResponseDto,
  OfferData,
} from './chat.dto';
// import { ICreateMessageDto, IUpdateMessageDto, IMessageResponseDto, PaginatedMessagesDto, CreateConversationDto, ConversationResponseDto, UpdateConversationDto, JoinConversationDto } from './chat.dto';
import {
  ConversationStatus,
  ConversationType,
  MessageStatus,
  MessageType,
  OfferStatus,
  UserRole,
} from '../../constant/enums';
// import { Conversation } from '../../models/conversation.model';
import { ForbiddenError } from '../../errors/forbidden-error';
import { BadRequestError } from '../../errors/bad-request-error';
// import { Offer } from '../../models/offer.model';

// import { sequelize } from '../../connection/postgres';
import { Transaction } from 'sequelize';
// import { User } from '../../models/user.model';

import {
  User,
  Conversation,
  Offer,
  Message,
  ConversationParticipant,
  sequelize,
  File,
  Child,
} from '@ustaad/shared';

interface MessageMetadata {
  offer?: object;
  // add more custom fields as needed
}

@Service()
export default class ChatService {
  async createMessage(senderId: string, messageData: ICreateMessageDto, role: string) {
    const transaction: Transaction = await sequelize.transaction();
    try {
      // Verify user is participant of the conversation
      const participant = await ConversationParticipant.findOne({
        where: {
          conversationId: messageData.conversationId,
          userId: senderId,
          isActive: true,
        },
        transaction,
      });

      if (!participant) {
        throw new ForbiddenError('User is not a participant of this conversation');
      }
      if (messageData.replyToId) {
        const originalMessage = await Message.findOne({
          where: { id: messageData.replyToId, conversationId: messageData.conversationId },
          transaction,
        });
        if (!originalMessage) {
          throw new BadRequestError('Reply target message does not exist');
        }
      }

      const message = await Message.create(
        {
          ...messageData,
          senderId,
        },
        { transaction }
      );

      if (messageData.type === MessageType.OFFER) {
        if (role !== UserRole.TUTOR) {
          throw new ForbiddenError('Only tutors can create offers');
        }
        if (!messageData.offer) {
          throw new BadRequestError('Offer data is required for message type OFFER');
        }

        const offerData = messageData.offer as OfferData;

        const children = await Child.findAll({
          where: { userId: offerData.receiverId, fullName: offerData.childName.toLowerCase() },
        });

        if (children.length === 0) {
          throw new BadRequestError('Child not found');
        }

        const existingOffer = await Offer.findOne({
          where: {
            conversationId: messageData.conversationId,
            senderId,
            receiverId: offerData.receiverId,
            childName: offerData.childName.toLowerCase(),
          },
        });

        if (existingOffer) {
          throw new BadRequestError("Offer already exists for this parent's child");
        }

        const savedOfferdata = await Offer.create(
          {
            conversationId: messageData.conversationId,
            senderId,
            receiverId: offerData.receiverId,
            messageId: message.id, // Link to message
            childName: offerData.childName.toLowerCase(),
            amountMonthly: offerData.amountMonthly,
            subject: offerData.subject,
            startDate: offerData.startDate,
            startTime: offerData.startTime,
            endTime: offerData.endTime,
            description: offerData.description || null,
            status: OfferStatus.PENDING, // Default or as needed
            daysOfWeek: offerData.daysOfWeek,
          },
          { transaction }
        );
        await message.update(
          {
            metadata: {
              offerId: savedOfferdata.id,
            },
          },
          { transaction }
        );
        (message.metadata as MessageMetadata).offer = savedOfferdata;

        // 🔔 SEND OFFER NOTIFICATION TO PARENT (will be sent after commit in the main notification block)
      }

      if (messageData.type == MessageType.FILE) {
        const file = await File.findOne({
          where: {
            id: messageData.fileId,
            conversationId: messageData.conversationId, // safety check
          },
          transaction,
        });
        if (!file) {
          throw new BadRequestError('File not found or not accessible');
        }
        await message.update(
          {
            metadata: {
              ...(message.metadata || {}),
              id: file.id,
              url: file.url,
              filename: file.filename,
              fileOriginalName: file.originalName,
              mimetype: file.mimetype,
              size: file.size,
              thumbnailUrl: file.thumbnailUrl,
            },
          },
          { transaction }
        );
      }

      await transaction.commit();

      // 🔔 SEND NOTIFICATION TO RECEIVER
      try {
        // Get receiver (other participant in conversation)
        const participants = await ConversationParticipant.findAll({
          where: {
            conversationId: messageData.conversationId,
            isActive: true,
          },
        });

        const receiver = participants.find((p) => p.userId !== senderId);

        if (receiver) {
          const sender = await User.findByPk(senderId);

          // Determine notification body based on message type
          let notificationBody = messageData.content || '';
          if (messageData.type === MessageType.IMAGE) {
            notificationBody = '📷 Sent an image';
          } else if (messageData.type === MessageType.FILE) {
            notificationBody = '📎 Sent a file';
          } else if (messageData.type === MessageType.AUDIO) {
            notificationBody = '🎤 Sent an audio message';
          } else if (messageData.type === MessageType.OFFER) {
            notificationBody = '💼 Sent a tutoring offer';
          }

          // Truncate long messages
          if (notificationBody.length > 100) {
            notificationBody = notificationBody.substring(0, 100) + '...';
          }

          // await sendNotificationToUser({
          //   userId: receiver.userId,
          //   type: NotificationType.NEW_MESSAGE,
          //   title: `${sender?.fullName || 'Someone'}`,
          //   body: notificationBody,
          //   relatedEntityId: message.id,
          //   relatedEntityType: 'message',
          //   actionUrl: `/chat/${messageData.conversationId}`,
          //   metadata: {
          //     conversationId: messageData.conversationId,
          //     senderId,
          //     senderName: sender?.fullName || 'Unknown',
          //     messageType: messageData.type,
          //   },
          // });

          console.log(`✅ Sent chat notification to user ${receiver.userId}`);
        }
      } catch (notificationError) {
        // Don't fail the message creation if notification fails
        console.error('❌ Error sending chat notification:', notificationError);
      }

      return this.formatMessageResponse(message);
    } catch (err: any) {
      await transaction.rollback();
      if (err instanceof ForbiddenError || err instanceof BadRequestError) {
        throw err;
      }
      throw new GenericError(err, 'Unable to create message');
    }
  }

  async getMessages(conversationId: string, userId: string, page: number = 1, limit: number = 20) {
    try {
      // Verify user is participant
      const participant = await ConversationParticipant.findOne({
        where: {
          conversationId,
          userId,
          isActive: true,
        },
      });

      if (!participant) {
        throw new ForbiddenError('User is not a participant of this conversation');
      }

      const whereClause: any = { conversationId };

      const offset = (page - 1) * limit;

      // First get total count
      const total = await Message.count({ where: whereClause });

      // If requested page is beyond available data, return empty array
      if (offset >= total && total > 0) {
        return {
          messages: [],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: false,
            hasPrev: page > 1,
            messageCount: 0,
          },
        };
      }

      const rows = await Message.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: Offer,
            as: 'offer',
            required: false, // Left join - messages without offer will still be fetched
          },
        ],
      });

      const messages = rows.map((message) => this.formatMessageResponse(message));
      console.log(messages, 'mewssages');

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
          messageCount: messages.length,
        },
      };
    } catch (err: any) {
      console.log(err, 'err');
      if (err instanceof ForbiddenError) {
        throw err;
      }
      throw new GenericError(err, 'Unable to get messages');
    }
  }

  async updateMessage(
    messageId: string,
    userId: string,
    updateData: IUpdateMessageDto
  ): Promise<IMessageResponseDto> {
    const message = await Message.findOne({
      where: {
        id: messageId,
        senderId: userId,
      },
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    await message.update({
      ...updateData,
      editedAt: new Date(),
    });

    return this.formatMessageResponse(message);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await Message.findOne({
      where: {
        id: messageId,
        senderId: userId,
      },
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    await message.update({
      status: MessageStatus.DELETED,
      content: 'This message was deleted',
    });
  }

  async markAsRead(conversationId: string, userId: string, messageId: string): Promise<void> {
    await ConversationParticipant.update(
      { lastReadAt: new Date() },
      {
        where: {
          conversationId,
          userId,
        },
      }
    );
  }

  async getMissedMessages(
    userId: string,
    lastSeenAt: string | Date
  ): Promise<IMessageResponseDto[]> {
    try {
      const userConversations = await ConversationParticipant.findAll({
        where: { userId, isActive: true },
        attributes: ['conversationId'],
      });
      const conversationIds = userConversations.map((c) => c.conversationId);
      if (conversationIds.length === 0) {
        return [];
      }

      const messages = await Message.findAll({
        where: {
          conversationId: { [Op.in]: conversationIds },
          createdAt: { [Op.gt]: new Date(lastSeenAt) },
        },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'name'] },
          { model: Offer, as: 'offer', required: false },
        ],
        order: [['createdAt', 'ASC']],
      });

      return messages.map((message) => this.formatMessageResponse(message));
    } catch (err: any) {
      console.log(err, 'err');
      if (err instanceof ForbiddenError || err instanceof BadRequestError) {
        throw err;
      }
      throw new GenericError(err, 'Unable to fetch missed messages');
    }
  }

  async markAsReadS(userId: string, Id: string) {
    const conversationId = Id;
    const lastReadAt = new Date();
    try {
      const [updatedRows] = await ConversationParticipant.update(
        { lastReadAt: lastReadAt },
        {
          where: {
            conversationId,
            userId,
          },
        }
      );

      // If no rows were updated, that means no matching participant was found
      if (updatedRows === 0) {
        throw new BadRequestError('Invalid conversation or user. Participant not found.');
      }
      return lastReadAt;
    } catch (err: any) {
      console.log(err, 'err');

      if (err instanceof BadRequestError) {
        throw err;
      }

      throw new GenericError(err, 'Unable to mark conversation as read');
    }
  }

  // ///////////     conversation

  async createConversation(createdBy: string, conversationData: CreateConversationDto) {
    try {
      const { participantIds, ...data } = conversationData;
      console.log(participantIds, 'participantIds');

      // For direct conversations, ensure only 2 participants
      if (data.type === ConversationType.DIRECT && participantIds.length !== 1) {
        throw new BadRequestError('Direct conversations must have exactly 2 participants');
      }
      console.log('hello2 participantIds');
      const users = await User.findAll({
        where: { id: participantIds },
        attributes: ['id'],
      });

      if (users.length !== participantIds.length) {
        throw new BadRequestError('One or more participants do not exist');
      }
      // Check if direct conversation already exists
      if (data.type === ConversationType.DIRECT) {
        const existingConversation = await this.findDirectConversation(
          createdBy,
          participantIds[0]
        );
        if (existingConversation) {
          return this.formatConversationResponse(existingConversation, createdBy);
        }
      }

      data.type = ConversationType.DIRECT;

      const conversation = await Conversation.create({
        ...(data as { type: ConversationType }),
        createdBy,
      });

      // Add creator as participant
      await ConversationParticipant.create({
        conversationId: conversation.id,
        userId: createdBy,
        role: 'admin',
      });

      // Add other participants
      const participantPromises = participantIds.map((userId) =>
        ConversationParticipant.create({
          conversationId: conversation.id,
          userId,
          role: 'member',
        })
      );

      await Promise.all(participantPromises);
      console.log('hello participantIds');

      return this.formatConversationResponse(conversation, createdBy);
    } catch (err: any) {
      if (err instanceof BadRequestError) {
        throw err;
      }
      throw new GenericError(err, 'Unable to create conversation');
    }
  }

  async getUserConversations(userId: string) {
    console.log('hello1');

    try {
      const participantRecords = await ConversationParticipant.findAll({
        where: {
          userId,
          isActive: true,
        },
        include: [
          {
            model: Conversation,
            as: 'conversation',
            where: {
              status: ConversationStatus.ACTIVE,
            },
          },
        ],
        order: [['updatedAt', 'DESC']],
      });
      console.log('hello2');

      const conversations = participantRecords.map((p) => p.get('conversation') as Conversation);
      console.log('hello3', conversations, participantRecords);

      return Promise.all(
        conversations.map((conv) => this.formatConversationResponse(conv, userId))
      );
    } catch (err: any) {
      console.log(err);
      // if (err instanceof BadRequestError ){
      //   throw err;
      // }
      throw new GenericError(err, 'Unable to get conversation');
    }
  }

  async getConversationById(conversationId: string, userId: string) {
    const participant = await ConversationParticipant.findOne({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error('Conversation not found or access denied');
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const participant2 = await ConversationParticipant.findOne({
      where: {
        conversationId,
        role: 'member',
        isActive: true,
      },
    });

    const participant2Ids = participant2.userId;

    return this.formatConversationResponse(conversation, userId);
  }

  //   async updateConversation(
  //     conversationId: string,
  //     userId: string,
  //     updateData: UpdateConversationDto
  //   ): Promise<ConversationResponseDto> {
  //     const participant = await ConversationParticipant.findOne({
  //       where: {
  //         conversationId,
  //         userId,
  //         role: { [Op.in]: ['admin', 'moderator'] },
  //       },
  //     });

  //     if (!participant) {
  //       throw new Error('Unauthorized to update this conversation');
  //     }

  //     const conversation = await Conversation.findByPk(conversationId);
  //     if (!conversation) {
  //       throw new Error('Conversation not found');
  //     }

  //     await conversation.update(updateData);
  //     return this.formatConversationResponse(conversation);
  //   }

  //     async joinConversation(conversationId: string, joinData: JoinConversationDto): Promise<void> {
  //     const conversation = await Conversation.findByPk(conversationId);
  //     if (!conversation) {
  //       throw new Error('Conversation not found');
  //     }

  //     if (conversation.type === ConversationType.DIRECT) {
  //       throw new Error('Cannot join direct conversations');
  //     }

  //     const existingParticipant = await ConversationParticipant.findOne({
  //       where: {
  //         conversationId,
  //         userId: joinData.userId,
  //       },
  //     });

  //     if (existingParticipant) {
  //       if (existingParticipant.isActive) {
  //         throw new Error('User is already a participant');
  //       }
  //       await existingParticipant.update({ isActive: true });
  //     } else {
  //       await ConversationParticipant.create({
  //         conversationId,
  //         userId: joinData.userId,
  //         role: joinData.role || 'member',
  //       });
  //     }
  //   }

  //   async leaveConversation(conversationId: string, userId: string): Promise<void> {
  //   const participant = await ConversationParticipant.findOne({
  //     where: {
  //       conversationId,
  //       userId,
  //       isActive: true,
  //     },
  //   });

  //   if (!participant) {
  //     throw new Error('User is not a participant of this conversation');
  //   }

  //   await participant.update({ isActive: false });
  // }

  private formatMessageResponse(message: Message): IMessageResponseDto {
    // Convert to JSON to safely access nested loaded models
    const msgJson = message.toJSON() as any;

    // If message has type OFFER and offer is loaded, embed offer inside metadata
    if (msgJson.type === MessageType.OFFER && msgJson.offer) {
      msgJson.metadata = {
        ...(msgJson.metadata || {}),
        offer: msgJson.offer,
      };
      delete msgJson.offer; // optional: remove the root offer property
    }
    if (
      [MessageType.FILE, MessageType.IMAGE, MessageType.AUDIO].includes(msgJson.type) &&
      msgJson.file
    ) {
      msgJson.metadata = {
        ...(msgJson.metadata || {}),
        file: {
          id: msgJson.file.id,
          url: msgJson.file.url,
          filename: msgJson.file.originalName,
          mimetype: msgJson.file.mimetype,
          size: msgJson.file.size,
          thumbnailUrl: msgJson.file.thumbnailUrl,
        },
      };
      delete msgJson.file;
    }
    return {
      id: msgJson.id,
      conversationId: msgJson.conversationId,
      senderId: msgJson.senderId,
      content: msgJson.content,
      type: msgJson.type,
      status: msgJson.status,
      replyToId: msgJson.replyToId,
      editedAt: msgJson.editedAt,
      metadata: msgJson.metadata,
      createdAt: msgJson.createdAt,
      updatedAt: msgJson.updatedAt,
    };
  }

  private async findDirectConversation(user1Id: string, user2Id: string) {
    console.log(user1Id, user2Id, 'users');
    try {
      const conversations = await Conversation.findAll({
        where: {
          type: ConversationType.DIRECT,
          status: ConversationStatus.ACTIVE,
        },
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            where: {
              userId: { [Op.in]: [user1Id, user2Id] },
              isActive: true,
            },
          },
        ],
      });

      for (const conversation of conversations) {
        const participants = conversation.get('participants') as ConversationParticipant[];

        console.log('hello3', participants);
        if (participants.length === 2) {
          console.log('hello5', participants);

          const userIds = participants.map((p) => p.userId);
          if (userIds.includes(user1Id) && userIds.includes(user2Id)) {
            return conversation;
          }
        }
        console.log('hello4', participants);
      }
      return null;
    } catch (err: any) {
      if (err instanceof BadRequestError) {
        throw err;
      }
      throw new GenericError(err, 'Unable to create conversation');
    }
  }

  private async formatConversationResponse(conversation: Conversation, currentUserId: string) {
    const participantCount = await ConversationParticipant.count({
      where: {
        conversationId: conversation.id,
        isActive: true,
      },
    });

    const currentParticipant = await ConversationParticipant.findOne({
      where: {
        conversationId: conversation.id,
        userId: currentUserId,
      },
    });

    // Get the other participant (for direct chat)
    let conversationName = conversation.name;
    let participantId = null;
    if (conversation.type === 'DIRECT' && participantCount === 2) {
      console.log('helooooooooo n n n');
      const otherParticipant = await ConversationParticipant.findOne({
        where: {
          conversationId: conversation.id,
          userId: { [Op.ne]: currentUserId },
          isActive: true,
        },
        include: [{ model: User, attributes: ['fullName', 'id'] }],
      });

      if (otherParticipant && (otherParticipant as any).User) {
        conversationName = (otherParticipant as any).User.fullName;
        participantId = (otherParticipant as any).User.id;
        console.log(otherParticipant, conversationName, 'hj');
      }
    }

    const lastMessage = await Message.findOne({
      where: {
        conversationId: conversation.id,
      },
      order: [['createdAt', 'DESC']],
    });

    return {
      id: conversation.id,
      name: conversationName,
      description: conversation.description,
      type: conversation.type,
      status: conversation.status,
      createdBy: conversation.createdBy,
      lastMessageAt: conversation.lastMessageAt,
      lastReadAt: currentParticipant?.lastReadAt || null,
      isPrivate: conversation.isPrivate,
      maxParticipants: conversation.maxParticipants,
      participantCount,
      participantId,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderName: 'Unknown', // Ideally you join the User model for this too
            createdAt: lastMessage.createdAt,
          }
        : undefined,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }
}
