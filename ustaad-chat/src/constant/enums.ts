export enum UserRole {
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
  TUTOR = 'TUTOR',
}


// is on boar
export enum IsOnBaord {
  REQUIRED = 'required',
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_REVIW = 'in review',
}


export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  OFFER='OFFER',
  AUDIO='AUDIO'
}

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL'
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  DELETED = 'DELETED'
}


export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}
