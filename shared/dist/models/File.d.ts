import { Model, Optional, Sequelize } from 'sequelize';
export interface FileAttributes {
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
    createdAt?: Date;
    updatedAt?: Date;
}
export type FileCreationAttributes = Optional<FileAttributes, 'id' | 'status' | 'thumbnailUrl' | 'expiresAt' | 'metadata' | 'createdAt' | 'updatedAt'>;
export declare class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
    id: string;
    conversationId: string;
    userId: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    status: 'active' | 'deleted' | 'expired';
    thumbnailUrl?: string | undefined;
    expiresAt?: Date | undefined;
    metadata?: Record<string, any> | undefined;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export declare function initFileModel(sequelize: Sequelize): typeof File;
