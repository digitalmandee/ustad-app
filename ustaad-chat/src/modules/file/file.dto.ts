import { MessageType } from "../../constant/enums";

// dto/file.dto.ts
export interface SaveFileDto {
  conversationId: string;
  file: Express.Multer.File; // from multer
}

export interface FileResponseDto {
  id: string;
  conversationId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  status: 'active' | 'deleted' | 'expired';
  thumbnailUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
export interface DeleteFileDto {
  fileId: string;
  userId: string;
}