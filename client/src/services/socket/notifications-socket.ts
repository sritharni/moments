import { io, type Socket } from 'socket.io-client';
import { getStoredToken } from '@/features/auth/utils/token-storage';
import type { Notification } from '@/types/notification';

type ServerToClientEvents = {
  'notification:new': (notification: Notification) => void;
};

type ClientToServerEvents = {
  'notifications:read-all': () => void;
};

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function buildNotificationsSocket(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  return io(`${BASE_URL}/notifications`, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket'],
    auth: (callback: (data: { token?: string }) => void) => {
      const token = getStoredToken();
      callback({ token: token ? `Bearer ${token}` : undefined });
    },
  });
}

export const notificationsSocket: Socket<
  ServerToClientEvents,
  ClientToServerEvents
> = buildNotificationsSocket();

export function connectNotificationsSocket() {
  if (!notificationsSocket.connected) {
    notificationsSocket.connect();
  }
  return notificationsSocket;
}

export function disconnectNotificationsSocket() {
  if (notificationsSocket.connected) {
    notificationsSocket.disconnect();
  }
}
