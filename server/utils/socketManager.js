// server/utils/socketManager.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
let io;

// Store active connections
const connections = {
  users: new Map(),      // userId -> socket
  admins: new Set(),     // admin sockets
  deliveryBoys: new Map(), // deliveryBoyId -> socket
  chatRooms: new Map()   // orderId -> Set of participants
};

const initialize = (server) => {
  io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: ["http://localhost:8080", "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 New socket connected:', socket.id);

    // Handle user authentication
    socket.on('authenticate', ({ userId, role, orderId }) => {
      try {
        if (!userId || !role) {
          socket.emit('auth_error', { message: 'Invalid authentication data' });
          return;
        }

        // Store connection based on role
        if (role === 'admin') {
          connections.admins.add(socket);
        } else if (role === 'delivery') {
          connections.deliveryBoys.set(userId, socket);
        } else {
          connections.users.set(userId, socket);
        }

        // Join order room if orderId is provided
        if (orderId) {
          socket.join(`order_${orderId}`);
          if (!connections.chatRooms.has(`order_${orderId}`)) {
            connections.chatRooms.set(`order_${orderId}`, new Set());
          }
          connections.chatRooms.get(`order_${orderId}`).add(socket);
        }

        socket.emit('authenticated');
        console.log(`🔐 User authenticated - Role: ${role}, ID: ${userId}`);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Handle reservation updates
    socket.on('reservation_status_update', (data) => {
      if (!socket.isAdmin) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      const userSocket = connections.users.get(data.userId);
      if (userSocket) {
        userSocket.emit('reservation_updated', data);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected:', socket.id);
      cleanup(socket);
    });
  });
};

// Helper function to clean up disconnected sockets
const cleanup = (socket) => {
  connections.admins.delete(socket);
  
  // Remove from users map
  for (const [userId, userSocket] of connections.users.entries()) {
    if (userSocket === socket) {
      connections.users.delete(userId);
      break;
    }
  }

  // Remove from delivery boys map
  for (const [deliveryBoyId, deliverySocket] of connections.deliveryBoys.entries()) {
    if (deliverySocket === socket) {
      connections.deliveryBoys.delete(deliveryBoyId);
      break;
    }
  }

  // Remove from chat rooms
  for (const [roomId, participants] of connections.chatRooms.entries()) {
    if (participants.has(socket)) {
      participants.delete(socket);
      if (participants.size === 0) {
        connections.chatRooms.delete(roomId);
      }
    }
  }
};

// Utility functions for emitting events
const emitToUser = (userId, event, data) => {
  const userSocket = connections.users.get(userId);
  if (userSocket) {
    userSocket.emit(event, data);
  }
};

const emitToAdmin = (event, data) => {
  connections.admins.forEach(socket => {
    socket.emit(event, data);
  });
};

const emitToDeliveryBoy = (deliveryBoyId, event, data) => {
  const socket = connections.deliveryBoys.get(deliveryBoyId);
  if (socket) {
    socket.emit(event, data);
  }
};

// Function to broadcast order updates
const broadcastOrderUpdate = (orderId, update) => {
  const room = connections.chatRooms.get(orderId);
  if (room) {
    room.forEach(socket => {
      socket.emit('order_update', update);
    });
  }
};

// Function to broadcast reservation updates
const broadcastReservationUpdate = (data) => {
  // Notify admins
  emitToAdmin('reservation_update', data);
  
  // Notify specific user if userId is provided
  if (data.userId) {
    emitToUser(data.userId, 'reservation_update', data);
  }
};

// Export socket manager functions
module.exports = {
  initialize,
  emitToUser,
  emitToAdmin,
  emitToDeliveryBoy,
  broadcastOrderUpdate,
  broadcastReservationUpdate,
  connections
};
