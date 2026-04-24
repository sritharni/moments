import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotifications } from '@/features/notifications/api/get-notifications';
import { markAllNotificationsRead } from '@/features/notifications/api/mark-all-read';
import { markNotificationRead } from '@/features/notifications/api/mark-read';
import { useNotifications } from '@/features/notifications/context/notification-context';
import type { Notification } from '@/types/notification';

function notificationLabel(n: Notification) {
  switch (n.type) {
    case 'NEW_MESSAGE':
      return `@${n.actor.username} sent you a message`;
    case 'FOLLOW_REQUEST':
      return `@${n.actor.username} wants to follow you`;
    case 'FOLLOW_ACCEPTED':
      return `@${n.actor.username} accepted your follow request`;
  }
}

function notificationLink(n: Notification) {
  switch (n.type) {
    case 'NEW_MESSAGE':
      return '/chat';
    case 'FOLLOW_REQUEST':
      return '/follow-requests';
    case 'FOLLOW_ACCEPTED':
      return `/profile/${n.actor.id}`;
  }
}

export function NotificationsPage() {
  const { markSocialRead } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    getNotifications()
      .then((data) => {
        setNotifications(data);
        markSocialRead();
        return markAllNotificationsRead();
      })
      .catch(() => {});
  }, [loaded, markSocialRead]);

  function handleClick(n: Notification) {
    if (!n.read) {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === n.id ? { ...notification, read: true } : notification,
        ),
      );
      void markNotificationRead(n.id);
    }
    void navigate(notificationLink(n));
  }

  const deduped = Array.from(new Map(notifications.map((n) => [n.id, n])).values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Activity</p>
        <h2>Notifications</h2>
      </div>

      {deduped.length === 0 ? (
        <div className="info-panel">
          <h3>All caught up</h3>
          <p>You have no notifications yet.</p>
        </div>
      ) : (
        <ul className="notif-list">
          {deduped.map((n) => (
            <li
              key={n.id}
              className={`notif-item${n.read ? '' : ' notif-item--unread'}`}
            >
              <button
                type="button"
                className="notif-item__btn"
                onClick={() => handleClick(n)}
              >
                <span className="notif-item__actor">
                  <Link
                    to={`/profile/${n.actor.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{n.actor.username}
                  </Link>
                </span>
                <span className="notif-item__text">{notificationLabel(n)}</span>
                <span className="notif-item__time">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
