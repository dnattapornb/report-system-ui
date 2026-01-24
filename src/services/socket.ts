import { io } from 'socket.io-client';

// Get the Socket URL from Environment Variables
const URL = import.meta.env.VITE_SOCKET_URL;

// Check if VITE_SOCKET_URL is set
if (!URL) {
  throw new Error('VITE_SOCKET_URL is not defined in .env file');
}

export const socket = io(URL, {
  transports: ['websocket'],
  // It's recommended to disable auto-connection and connect manually when needed
  // autoConnect: false,
});
