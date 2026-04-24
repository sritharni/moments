import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  connectNotificationsSocket,
  disconnectNotificationsSocket,
  notificationsSocket,
} from '@/services/socket/notifications-socket';
import { apiClient } from '@/services/api/client';
import type { Notification } from '@/types/notification';

type Counts = { chat: number; social: number };

type NotificationContextValue = {
  chatUnreadCount: number;
  socialUnreadCount: number;
  markChatRead: () => void;
  markSocialRead: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts>({ chat: 0, social: 0 });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setCounts({ chat: 0, social: 0 });
      fetchedRef.current = false;
      disconnectNotificationsSocket();
      return;
    }

    connectNotificationsSocket();

    if (!fetchedRef.current) {
      fetchedRef.current = true;
      apiClient
        .get<Counts>('/notifications/unread-counts')
        .then(({ data }) => setCounts(data))
        .catch(() => {});
    }

    function handleNew(notification: Notification) {
      setCounts((prev) => {
        if (notification.type === 'NEW_MESSAGE') {
          return { ...prev, chat: prev.chat + 1 };
        }
        return { ...prev, social: prev.social + 1 };
      });
    }

    notificationsSocket.on('notification:new', handleNew);
    return () => {
      notificationsSocket.off('notification:new', handleNew);
    };
  }, [user]);

  const markChatRead = useCallback(() => {
    setCounts((prev) => ({ ...prev, chat: 0 }));
    apiClient.patch('/notifications/read-chat').catch(() => {});
  }, []);

  const markSocialRead = useCallback(() => {
    setCounts((prev) => ({ ...prev, social: 0 }));
    apiClient.patch('/notifications/read-social').catch(() => {});
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        chatUnreadCount: counts.chat,
        socialUnreadCount: counts.social,
        markChatRead,
        markSocialRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
