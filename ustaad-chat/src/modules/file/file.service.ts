import { Service } from 'typedi';
import { GenericError } from '../../errors/generic-error';
import { Op } from 'sequelize';
// import { Message } from '../../models/message.model';
// import { ICreateMessageDto, IUpdateMessageDto, IMessageResponseDto, PaginatedMessagesDto, CreateConversationDto, ConversationResponseDto, UpdateConversationDto, JoinConversationDto } from './chat.dto';

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
} from '@ustaad/shared';
import path from 'path';

interface MessageMetadata {
  offer?: object;
  // add more custom fields as needed
}

@Service()
export default class FileService {
  async saveFile(userId: string, fileMetaData: any, conversationId: string, duration: string) {
    const transaction = await sequelize.transaction(); // start transaction

    try {
      // ✅ Verify user is participant of the conversation
      const participant = await ConversationParticipant.findOne({
        where: {
          conversationId,
          userId,
          isActive: true,
        },
        transaction, // run inside transaction
      });

      if (!participant) {
        throw new ForbiddenError('User is not a participant of this conversation');
      }

      // ✅ Build file path + URL
      const subFolder = path.basename(path.dirname(fileMetaData.path));
      const baseUploadUrl = process.env.FILE_BASE_URL || '/uploads';
      const url = `${baseUploadUrl}/${fileMetaData.filename}`;
      // const url = `/uploads/${subFolder}/${fileMetaData.filename}`;

      // ✅ Create file record
      const created = await File.create(
        {
          conversationId,
          userId,
          filename: fileMetaData.filename,
          originalName: fileMetaData.originalname,
          mimetype: fileMetaData.mimetype,
          size: fileMetaData.size,
          url,
          status: 'active',
          metadata: { absolutePath: fileMetaData.path, duration },
        },
        { transaction } // ensure file save is part of transaction
      );

      await transaction.commit(); // ✅ commit transaction
      return created;
    } catch (err: any) {
      await transaction.rollback(); // ❌ rollback on error
      if (err instanceof ForbiddenError || err instanceof BadRequestError) {
        throw err;
      }
      throw new GenericError(err, 'Unable to save file');
    }
  }

  async getFile(userId: string, fileId: string) {
    try {
      // 1. Find the file
      const file = await File.findOne({ where: { id: fileId } });
      if (!file) {
        throw new Error('FILE_NOT_FOUND');
      }

      // 2. Ensure user is participant of that file's conversation
      const participant = await ConversationParticipant.findOne({
        where: {
          conversationId: file.conversationId,
          userId,
          isActive: true,
        },
      });

      if (!participant) {
        throw new ForbiddenError('User not allowed to view this file. Not in conversation');
      }

      return file;
    } catch (err: any) {
      if (err instanceof ForbiddenError || err instanceof BadRequestError) {
        throw err;
      }
      throw new GenericError(err, 'Unable to fetch file');
    }
  }
}
