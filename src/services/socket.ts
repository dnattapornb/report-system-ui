import { io } from 'socket.io-client';

// Point to NestJS Backend URL
export const socket = io('http://localhost:3000', {
  transports: ['websocket']
});
