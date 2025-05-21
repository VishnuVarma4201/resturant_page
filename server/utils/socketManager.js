// server/utils/socketManager.js
const { Server } = require('socket.io');
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
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('🟢 New socket connected:', socket.id);

    // Handle user authentication
    socket.on('authenticate', ({ userId, role, orderId }) => {
      if (!userId || !role) return;

      switch (role) {
        case 'user':
          connections.users.set(userId, socket);
          socket.join(`user_${userId}`);
          if (orderId) socket.join(`order_${orderId}`);
          break;
        case 'admin':
          connections.admins.add(socket);
          socket.join('admins');
          break;
        case 'delivery':
          connections.deliveryBoys.set(userId, socket);
          socket.join(`delivery_${userId}`);
          if (orderId) socket.join(`order_${orderId}`);
          break;
      }

      console.log(`👤 Authenticated ${role} with ID: ${userId}`);
    });

    // Handle chat messages
    socket.on('chat_message', ({ orderId, message, sender }) => {
      const roomId = `order_${orderId}`;
      io.to(roomId).emit('new_message', {
        orderId,
        message,
        sender,
        timestamp: new Date()
      });
    });

    // Handle delivery location updates
    socket.on('location_update', ({ orderId, location, deliveryBoyId }) => {
      handleDeliveryLocationUpdate({
        orderId,
        location,
        deliveryBoyId,
        timestamp: new Date()
      });
    });

    // Handle join order room
    socket.on('join_order_room', ({ orderId, userId, role }) => {
      const roomId = `order_${orderId}`;
      socket.join(roomId);
      
      if (!connections.chatRooms.has(orderId)) {
        connections.chatRooms.set(orderId, new Set());
      }
      connections.chatRooms.get(orderId).add(userId);

      io.to(roomId).emit('room_joined', {
        userId,
        role,
        timestamp: new Date()
      });
    });

    // Handle leave order room
    socket.on('leave_order_room', ({ orderId, userId }) => {
      const roomId = `order_${orderId}`;
      socket.leave(roomId);
      
      const room = connections.chatRooms.get(orderId);
      if (room) {
        room.delete(userId);
        if (room.size === 0) {
          connections.chatRooms.delete(orderId);
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected:', socket.id);
      cleanupConnection(socket);
    });
  });
};

// Cleanup function for disconnected sockets
const cleanupConnection = (socket) => {
  connections.admins.delete(socket);
  
  for (const [userId, userSocket] of connections.users.entries()) {
    if (userSocket === socket) {
      connections.users.delete(userId);
      break;
    }
  }
  
  for (const [deliveryBoyId, deliverySocket] of connections.deliveryBoys.entries()) {
    if (deliverySocket === socket) {
      connections.deliveryBoys.delete(deliveryBoyId);
      break;
    }
  }

  // Cleanup chat rooms
  for (const [orderId, participants] of connections.chatRooms.entries()) {
    for (const userId of participants) {
      if (connections.users.get(userId) === socket || 
          connections.deliveryBoys.get(userId) === socket) {
        participants.delete(userId);
        if (participants.size === 0) {
          connections.chatRooms.delete(orderId);
        }
        break;
      }
    }
  }
};

// Notify specific user
const notifyUser = (userId, event, data) => {
  const socket = connections.users.get(userId);
  if (socket) {
    socket.emit(event, data);
  }
};

// Notify delivery boy
const notifyDeliveryBoy = (deliveryBoyId, event, data) => {
  const socket = connections.deliveryBoys.get(deliveryBoyId);
  if (socket) {
    socket.emit(event, data);
  }
};

// Notify all admins
const notifyAdmins = (event, data) => {
  connections.admins.forEach(socket => {
    socket.emit(event, data);
  });
};

// Handle delivery location updates
const handleDeliveryLocationUpdate = ({ orderId, location, deliveryBoyId, timestamp }) => {
  // Notify admins about location update
  notifyAdmins('delivery_location_updated', { 
    orderId, 
    location, 
    deliveryBoyId, 
    timestamp 
  });

  // Notify customer about delivery location
  for (const [userId, userSocket] of connections.users.entries()) {
    if (userSocket.rooms.has(`order_${orderId}`)) {
      notifyUser(userId, 'delivery_location_updated', { orderId, location, timestamp });
    }
  }
};

module.exports = {
  initialize,
  notifyUser,
  notifyDeliveryBoy,
  notifyAdmins
};
