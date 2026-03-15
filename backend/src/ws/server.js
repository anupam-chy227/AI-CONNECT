// WebSocket server for realtime event broadcasting
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const publisher = require('../events/publisher');

const WS_SECRET = process.env.WS_SECRET || 'dev_ws_secret_12345';

function initWebSocketServer(httpServer) {
  const io = socketIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Middleware to verify JWT token
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, WS_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err) {
      console.error('[WS] JWT verification failed:', err.message);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`[WS] User connected: ${socket.userId} (socket: ${socket.id})`);

    // Subscribe to post.created events from backend
    const unsubscribe = publisher.subscribe('post.created', (eventData) => {
      console.log(`[WS] Broadcasting post.created to ${socket.id}`);
      socket.emit('post.created', eventData);
    });

    // Subscription to post.updated events
    const unsubscribeUpdate = publisher.subscribe('post.updated', (eventData) => {
      socket.emit('post.updated', eventData);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[WS] User disconnected: ${socket.userId} (socket: ${socket.id})`);
      unsubscribe();
      unsubscribeUpdate();
    });

    // Heartbeat to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  console.log('[WS] WebSocket server initialized');
  return io;
}

module.exports = {
  initWebSocketServer,
};
