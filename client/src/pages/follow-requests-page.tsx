import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { acceptFollowRequest } from '@/features/users/api/accept-follow-request';
import { getFollowRequests } from '@/features/users/api/get-follow-requests';
import { rejectFollowRequest } from '@/features/users/api/reject-follow-request';
import { useNotifications } from '@/features/notifications/context/notification-context';
import type { FollowRequestItem } from '@/types/user';

export function FollowRequestsPage() {
  const [requests, setRequests] = useState<FollowRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { markSocialRead } = useNotifications();

  useEffect(() => {
    markSocialRead();
    getFollowRequests()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [markSocialRead]);

  async function handleAccept(requestId: string) {
    setPendingId(requestId);
    try {
      await acceptFollowRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
    } finally {
      setPendingId(null);
    }
  }

  async function handleReject(requestId: string) {
    setPendingId(requestId);
    try {
      await rejectFollowRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Social</p>
        <h2>Follow requests</h2>
      </div>

      {loading && <p className="body-copy">Loading...</p>}

      {!loading && requests.length === 0 && (
        <div className="info-panel" style={{ marginTop: '1rem' }}>
          <h3>No pending requests</h3>
          <p>You&apos;re all caught up.</p>
        </div>
      )}

      {requests.length > 0 && (
        <div className="user-card-list">
          {requests.map((req) => (
            <div className="user-card" key={req.id}>
              <div className="user-card__avatar">
                {req.requester.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="user-card__info">
                <Link to={`/profile/${req.requester.id}`}>
                  <strong>@{req.requester.username}</strong>
                </Link>
                <span>
                  {new Date(req.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="follow-request-actions">
                <button
                  className="submit-button"
                  type="button"
                  disabled={pendingId === req.id}
                  onClick={() => void handleAccept(req.id)}
                >
                  Accept
                </button>
                <button
                  className="reject-button"
                  type="button"
                  disabled={pendingId === req.id}
                  onClick={() => void handleReject(req.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
