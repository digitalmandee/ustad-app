import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import ChatController from '../modules/chat/chat.controller';

const chatController = new ChatController();

export let io: Server;

function registerSocketHandlers(socket: Socket) {
  socket.on('joinConversation', (conversationId) =>
    chatController.handleJoinConversation(socket, conversationId)
  );

  socket.on('sendMessage', (data) =>
    chatController.handleSendMessage(socket, data)
  );
  socket.on('markAsRead', (data) =>
    chatController.markAsReadS(socket, data)
  );

  // socket.on('getMissedMessages', (payload) =>
  //   chatController.handleGetMissedMessages(socket, payload)
  // );

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
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
