import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(API_BASE_URL, {
  autoConnect: false,
  withCredentials: true
});

// Authenticate socket connection
export const connectSocket = (token: string, role: string, orderId?: string) => {
  if (!socket.connected) {
    socket.auth = { token, role, orderId };
    socket.connect();
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Event handlers
socket.on('connect', () => {
  console.log('Socket connected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});
