import { Service } from 'typedi';
import { GenericError } from '../../errors/generic-error';
import { Op } from 'sequelize';
import {
  ICreateMessageDto,
  IUpdateMessageDto,
  IMessageResponseDto,
  PaginatedMessagesDto,
  CreateConversationDto,
  ConversationResponseDto,
  OfferData,
} from './chat.dto';
import {
  ConversationStatus,
  ConversationType,
  MessageStatus,
  MessageType,
  OfferStatus,
  UserRole,
} from '../../constant/enums';
import { ForbiddenError } from '../../errors/forbidden-error';
import { BadRequestError } from '../../errors/bad-request-error';
import { Transaction } from 'sequelize';

import {
  User,
  Conversation,
  Offer,
  Message,
  ConversationParticipant,
  sequelize,
  File,
  Child,
  NotificationType,
} from '@ustaad/shared';
import { sendNotificationToUser } from '../../services/notification.service';

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

        const searchName = offerData.childName.toLowerCase();
        const children = await Child.findAll({
          where: {
            userId: offerData.receiverId,
            [Op.or]: [
              { firstName: searchName },
              { lastName: searchName },
              sequelize.where(
                sequelize.fn('concat', sequelize.col('firstName'), ' ', sequelize.col('lastName')),
                searchName
              ),
            ],
          },
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
            status: { [Op.in]: [OfferStatus.ACCEPTED] },
          },
        });

        if (existingOffer) {
          throw new BadRequestError("An active offer already exists for this parent's child");
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
            sessions: offerData.sessions,
            startDate: offerData.startDate,
            startTime: offerData.startTime,
            endTime: offerData.endTime,
            description: offerData.description || null,
            status: OfferStatus.PENDING, // Default or as needed
            daysOfWeek: offerData.daysOfWeek,
          } as any,
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
      } else if (messageData.type == MessageType.AUDIO) {
        // Assuming audio file info is stored similarly in File model with duration in metadata
        const audioFile = await File.findOne({
          where: {
            id: messageData.fileId,
            conversationId: messageData.conversationId,
          },
          transaction,
        });
        if (!audioFile) {
          throw new BadRequestError('Audio file not found or not accessible');
        }
        // Extract duration from audioFile.metadata if present
        const duration = audioFile.metadata?.duration || null;
        // Update message metadata with audio details and duration
        await message.update(
          {
            metadata: {
              ...(message.metadata || {}),
              id: audioFile.id,
              url: audioFile.url,
              filename: audioFile.filename,
              fileOriginalName: audioFile.originalName,
              mimetype: audioFile.mimetype,
              size: audioFile.size,
              thumbnailUrl: audioFile.thumbnailUrl,
              duration,
            },
          },
          { transaction }
        );
        // Also store duration in File metadata for future reference
        await audioFile.update(
          { metadata: { ...(audioFile.metadata || {}), duration } },
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
          const receiverUser = await User.findByPk(receiver.userId);
          const receiverToken = receiverUser?.deviceId;
          if (!receiverToken) {
          } else {
            // Determine notification body based on message type
            let notificationBody = messageData.content || '';
            if (messageData.type === MessageType.IMAGE) {
              notificationBody = '📷 Sent an image';
            } else if (messageData.type === MessageType.AUDIO) {
              notificationBody = '🎤 Sent a voice message';
            } else if (messageData.type === MessageType.FILE) {
              notificationBody = '📁 Sent a file';
            } else if (messageData.type === MessageType.OFFER) {
              notificationBody = '📄 Sent an offer';
            }

            if (notificationBody.length > 100) {
              notificationBody = notificationBody.substring(0, 100) + '...';
            }

            // Determine notification type
            const notificationType =
              messageData.type === MessageType.OFFER
                ? NotificationType.OFFER_RECEIVED
                : NotificationType.NEW_MESSAGE;

            await sendNotificationToUser(
              receiver.userId,
              receiverToken,
              `${sender?.firstName} ${sender?.lastName}`,
              notificationBody,
              {
                type: 'NEW_MESSAGE',
                conversationId: messageData.conversationId,
                senderId,
                senderName: `${sender?.firstName} ${sender?.lastName}`,
                messageType: messageData.type,
                messageId: message.id,
              },
              sender?.image || undefined,
              `/chat`,
              notificationType
            );
          }
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

      const whereClause: any = {
        conversationId,
        status: { [Op.ne]: MessageStatus.DELETED },
      };

      const offset = (page - 1) * limit;

      // First get total count
      const total = await Message.count({ where: whereClause });

      const unreadCount = await Message.count({
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          createdAt: { [Op.gt]: (participant as any).lastReadAt || new Date(0) },
          status: { [Op.ne]: MessageStatus.DELETED },
        },
      });

      // If requested page is beyond available data, return empty array
      if (offset >= total && total > 0) {
        return {
          messages: [] as IMessageResponseDto[],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: false,
            hasPrev: page > 1,
            messageCount: 0,
            unreadCount,
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
          unreadCount,
        },
      };
    } catch (err: any) {
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

  async deleteMessageS(messageId: any, userId: string): Promise<Message> {
    console.log('messageId', messageId);
    console.log('userId', userId);

    const message = await Message.findOne({
      where: {
        id: messageId.messageId,
        senderId: userId,
      },
    });

    console.log('message', message);

    if (!message) {
      throw new BadRequestError('Message not found or unauthorized');
    }

    console.log('messagessssssss');

    await message.update({
      status: MessageStatus.DELETED,
      content: 'This message was deleted',
    });

    return message;
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
          status: { [Op.ne]: MessageStatus.DELETED },
        },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] },
          { model: Offer, as: 'offer', required: false },
        ],
        order: [['createdAt', 'ASC']],
      });

      return messages.map((message) => this.formatMessageResponse(message));
    } catch (err: any) {
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
      if (err instanceof BadRequestError) {
        throw err;
      }

      throw new GenericError(err, 'Unable to mark conversation as read');
    }
  }

  async bulkDeleteMessages(messageIds: string[], userId: string): Promise<void> {
    await Message.update(
      {
        status: MessageStatus.DELETED,
        content: 'This message was deleted',
      },
      {
        where: {
          id: { [Op.in]: messageIds },
          senderId: userId,
        },
      }
    );
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const participant = await ConversationParticipant.findOne({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error('User is not a participant of this conversation');
    }

    await participant.update({ isActive: false });
  }

  async bulkDeleteConversations(conversationIds: string[], userId: string): Promise<void> {
    await ConversationParticipant.update(
      { isActive: false },
      {
        where: {
          conversationId: { [Op.in]: conversationIds },
          userId,
        },
      }
    );
  }

  // ///////////     conversation

  async createConversation(createdBy: string, conversationData: CreateConversationDto) {
    try {
      const { participantIds, ...data } = conversationData;

      // For direct conversations, ensure only 2 participants
      if (data.type === ConversationType.DIRECT && participantIds.length !== 1) {
        throw new BadRequestError('Direct conversations must have exactly 2 participants');
      }

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

      return this.formatConversationResponse(conversation, createdBy);
    } catch (err: any) {
      if (err instanceof BadRequestError) {
        throw err;
      }
      throw new GenericError(err, 'Unable to create conversation');
    }
  }

  async getUserConversations(userId: string, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const total = await ConversationParticipant.count({
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
      });

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
        order: [
          [
            sequelize.literal(
              '(SELECT MAX("createdAt") FROM "messages" WHERE "messages"."conversationId" = "conversation"."id")'
            ),
            'DESC',
          ],
        ],
        limit,
        offset,
      });

      const conversations = participantRecords.map((p) => p.get('conversation') as Conversation);

      const items = await Promise.all(
        conversations.map((conv) => this.formatConversationResponse(conv, userId))
      );

      return {
        conversations: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (err: any) {
      throw new GenericError(err, 'Unable to get conversation');
    }
  }

  async getConversationById(conversationId: string, userId: string, role?: string) {
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

    return this.formatConversationResponse(conversation, userId, role);
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

        if (participants.length === 2) {
          const userIds = participants.map((p) => p.userId);
          if (userIds.includes(user1Id) && userIds.includes(user2Id)) {
            return conversation;
          }
        }
      }
      return null;
    } catch (err: any) {
      if (err instanceof BadRequestError) {
        throw err;
      }
      throw new GenericError(err, 'Unable to create conversation');
    }
  }

  private async formatConversationResponse(
    conversation: Conversation,
    currentUserId: string,
    role?: string
  ) {
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
    let participantImage = '';
    let participantRegistrationTime = null;
    if (conversation.type === 'DIRECT' && participantCount === 2) {
      const otherParticipant = await ConversationParticipant.findOne({
        where: {
          conversationId: conversation.id,
          userId: { [Op.ne]: currentUserId },
          isActive: true,
        },
        include: [
          { model: User, attributes: ['firstName', 'lastName', 'id', 'image', 'createdAt'] },
        ],
      });

      if (otherParticipant && (otherParticipant as any).User) {
        conversationName = `${(otherParticipant as any).User.firstName} ${(otherParticipant as any).User.lastName}`;
        participantId = (otherParticipant as any).User.id;
        participantImage = (otherParticipant as any).User.image || '';
        participantRegistrationTime = (otherParticipant as any).User.createdAt;
      }
    }
    const lastMessage = await Message.findOne({
      where: {
        conversationId: conversation.id,
        status: { [Op.ne]: MessageStatus.DELETED },
      },
      include: [{ model: User, as: 'sender', attributes: ['firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
    });

    let children: any[] = [];
    if (role === UserRole.PARENT) {
      children = await Child.findAll({
        where: { userId: currentUserId },
      });
    } else if (role === UserRole.TUTOR) {
      const otherParticipant = await ConversationParticipant.findOne({
        where: {
          conversationId: conversation.id,
          userId: { [Op.ne]: currentUserId },
          isActive: true,
        },
      });
      if (otherParticipant) {
        children = await Child.findAll({
          where: { userId: otherParticipant.userId },
        });
      }
    }
    const unreadCount = await Message.count({
      where: {
        conversationId: conversation.id,
        senderId: { [Op.ne]: currentUserId },
        status: MessageStatus.SENT,
      },
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
      unreadCount,
      isPrivate: conversation.isPrivate,
      maxParticipants: conversation.maxParticipants,
      participantCount,
      participantId,
      participantImage,
      participantRegistrationTime,
      children,
      lastMessage: lastMessage
        ? await (async () => {
            const msgJson = lastMessage.toJSON() as any;
            let fileData = undefined;

            if ([MessageType.FILE, MessageType.IMAGE, MessageType.AUDIO].includes(msgJson.type)) {
              const meta: any = msgJson.metadata || {};
              const fileId = meta.id;

              if (fileId) {
                const fileRecord = await File.findByPk(fileId);
                if (fileRecord) {
                  fileData = {
                    id: fileRecord.id,
                    url: fileRecord.url,
                    filename: fileRecord.originalName,
                    mimetype: fileRecord.mimetype,
                    size: Number(fileRecord.size),
                    thumbnailUrl: fileRecord.thumbnailUrl,
                  };
                }
              }
            }

            return {
              id: msgJson.id,
              content: (() => {
                if (msgJson.type === MessageType.TEXT) return msgJson.content;
                if (msgJson.type === MessageType.IMAGE) return '📷 Image';
                if (msgJson.type === MessageType.AUDIO) return '🎤 Voice message';
                if (msgJson.type === MessageType.FILE) return '📄 File';
                if (msgJson.type === MessageType.OFFER) return '📄 Offer';
                return msgJson.content;
              })(),
              type: msgJson.type,
              metadata: msgJson.metadata, // Ensure this is passed
              file: fileData,
              senderId: msgJson.senderId,
              senderName: `${msgJson.sender?.firstName} ${msgJson.sender?.lastName}`,
              createdAt: msgJson.createdAt,
            };
          })()
        : undefined,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const transaction = await sequelize.transaction();
    try {
      const participants = await ConversationParticipant.findAll({
        where: { conversationId },
        transaction,
      });

      if (participants.length === 0) {
        throw new BadRequestError('Conversation not found or has no participants.');
      }

      const currentParticipant = participants.find((p) => p.userId === userId);
      if (!currentParticipant) {
        throw new BadRequestError('User is not a participant of this conversation.');
      }

      // Update lastReadAt for current user
      await currentParticipant.update({ lastReadAt: new Date() }, { transaction });

      // Identify other participant IDs
      const otherParticipantIds = participants
        .filter((p) => p.userId !== userId)
        .map((p) => p.userId);

      // Mark messages sent by others as READ
      if (otherParticipantIds.length > 0) {
        await Message.update(
          { status: MessageStatus.READ },
          {
            where: {
              conversationId,
              senderId: { [Op.in]: otherParticipantIds },
              status: { [Op.ne]: MessageStatus.READ },
            },
            transaction,
          }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
