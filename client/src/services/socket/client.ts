import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { getStoredToken } from '@/features/auth/utils/token-storage';
import type { ApiMessage } from '@/types/chat';

type ServerToClientEvents = {
  'chat:message': (message: ApiMessage) => void;
  'chat:message-deleted': (payload: { id: string; conversationId: string }) => void;
  'chat:sent': (message: ApiMessage) => void;
  'chat:joined': (payload: { conversationId: string; room: string }) => void;
  'chat:error': (payload: { message: string }) => void;
};

type ClientToServerEvents = {
  'chat:join': (payload: { conversationId: string }) => void;
  'chat:send': (payload: {
    conversationId?: string;
    recipientId?: string;
    content: string;
  }) => void;
};

function buildSocket() {
  return io(env.socketUrl, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket'],
    auth: (callback: (data: { token?: string }) => void) => {
      const token = getStoredToken();

      callback({
        token: token ? `Bearer ${token}` : undefined,
      });
    },
  });
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  buildSocket();

export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export function refreshSocketAuth() {
  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();
}
