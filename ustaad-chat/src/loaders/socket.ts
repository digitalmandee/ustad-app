import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import ChatController from '../modules/chat/chat.controller';

const chatController = new ChatController();

export let io: Server;

// Track user socket connections (userId -> socketId)
const userSocketMap = new Map<string, string>();

function registerSocketHandlers(socket: Socket) {
  console.log('.data', socket.data);

  // Register user's socket connection
  const userId = (socket.data.user as any)?.id;
  if (userId) {
    userSocketMap.set(userId, socket.id);
    console.log(`🔌 Registered user ${userId} with socket ${socket.id}`);

    // Join user to their personal notification room
    socket.join(`user:${userId}`);
  }

  socket.on('joinConversation', (conversationId) =>
    chatController.handleJoinConversation(socket, conversationId)
  );

  socket.on('sendMessage', (data) => chatController.handleSendMessage(socket, data));
  socket.on('markAsRead', (data) => chatController.markAsReadS(socket, data));
  socket.on('deleteMessage', (data) => chatController.handleDeleteMessageS(socket, data));

  // socket.on('getMissedMessages', (payload) =>
  //   chatController.handleGetMissedMessages(socket, payload)
  // );

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    // Remove user from socket map
    if (userId) {
      userSocketMap.delete(userId);
      console.log(`🔌 Unregistered user ${userId}`);
    }
  });
}

/**
 * Emit a real-time notification to a user
 * @param userId - User ID to send notification to
 * @param notification - Notification data
 */
export function emitNotificationToUser(userId: string, notification: any) {
  if (!io) {
    console.warn('⚠️ Socket.IO not initialized, cannot emit notification');
    return;
  }

  // Emit to user's personal room
  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`📤 Emitted real-time notification to user ${userId}`);
}

/**
 * Emit a real-time notification to multiple users
 * @param userIds - Array of user IDs
 * @param notification - Notification data
 */
export function emitNotificationToUsers(userIds: string[], notification: any) {
  if (!io) {
    console.warn('⚠️ Socket.IO not initialized, cannot emit notifications');
    return;
  }

  userIds.forEach((userId) => {
    io.to(`user:${userId}`).emit('notification', notification);
  });
  console.log(`📤 Emitted real-time notification to ${userIds.length} users`);
}

export default function socketLoader(httpServer?: HTTPServer) {
  if (!httpServer) {
    console.warn('⚠️  HTTP server not provided, Socket.IO will not be initialized');
    return;
  }

  try {
    io = new Server(httpServer, {
      cors: {
        origin: '*', // Use specific origin in production
        methods: ['GET', 'POST'],
      },
    });

    // Middleware: Verify token before allowing connection
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        socket.data.user = decoded; // store user info on socket
        next();
      } catch (err) {
        return next(new Error('Invalid or expired token'));
      }
    });

    // 🔌 Connection
    io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}, user:`, socket.data.user);
      registerSocketHandlers(socket); // Delegate to router
    });

    console.log('🔌 Socket.IO initialized and listening...');
  } catch (error) {
    console.error('❌ Failed to initialize Socket.IO:', error);
  }
}
