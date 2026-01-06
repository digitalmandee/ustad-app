import { MessageType } from '@ustaad/shared';

export interface ICreateMessageDto {
  conversationId: string;
  content: string;
  type?: MessageType;
  replyToId?: string;
  metadata?: object;
  offer?: object;
  fileId?: string;
}

export interface OfferData {
  receiverId: string;
  childName: string;
  amountMonthly: number;
  subject: string;
  startDate: Date;
  startTime: string;
  endTime: string;
  description?: string;
  daysOfWeek: string[];
  sessions: number;
}
export interface IUpdateMessageDto {
  content?: string;
  metadata?: object;
}

export interface IMessageResponseDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderProfilePic?: string;
  content: string;
  type: string;
  status: string;
  replyToId?: string;
  replyToMessage?: IMessageResponseDto;
  editedAt?: Date;
  metadata?: object;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedMessagesDto {
  messages: IMessageResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    unreadCount: number;
  };
}

export interface CreateConversationDto {
  name?: string;
  description?: string;
  type: string;
  participantIds: string[];
  isPrivate?: boolean;
  maxParticipants?: number;
}

// export interface UpdateConversationDto {
//   name?: string;
//   description?: string;
//   isPrivate?: boolean;
//   maxParticipants?: number;
// }

export interface ConversationResponseDto {
  id: string;
  name?: string;
  description?: string;
  type: string;
  status: string;
  createdBy: string;
  lastMessageAt?: Date;
  isPrivate: boolean;
  maxParticipants?: number;
  participantCount: number;
  unreadCount?: number;
  lastMessage?: {
    id: string;
    content: string;
    senderName: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// export interface JoinConversationDto {
//   userId: string;
//   role?: string;
// }
