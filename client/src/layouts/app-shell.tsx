import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NavLinkCard } from '@/components/navigation/nav-link-card';
import { useAuth } from '@/features/auth/context/auth-context';
import { useNotifications } from '@/features/notifications/context/notification-context';

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatUnreadCount, socialUnreadCount } = useNotifications();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <span className="brand-mark__icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="presentation">
                <defs>
                  <linearGradient id="momentsIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="55%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <rect
                  x="6"
                  y="6"
                  width="52"
                  height="52"
                  rx="18"
                  fill="url(#momentsIconGradient)"
                />
                <circle cx="32" cy="30" r="11" fill="rgba(255,255,255,0.96)" />
                <circle cx="32" cy="30" r="5.5" fill="#2563eb" />
                <circle cx="45" cy="19" r="3.2" fill="#fef3c7" />
                <path
                  d="M18 45.5c4.2-4.8 8.8-7.2 14-7.2s9.8 2.4 14 7.2"
                  fill="none"
                  stroke="rgba(255,255,255,0.92)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <h1>Moments</h1>
          </div>
          <p className="lede">Life, as it happens.</p>
        </div>

        <nav className="nav-grid" aria-label="Main navigation">
          {user ? (
            <>
              <NavLinkCard
                to="/feed"
                title="Feed"
                description="Posts from people you follow"
              />
              <NavLinkCard
                to="/chat"
                title="Chat"
                description="Messages and conversations"
                badge={chatUnreadCount}
              />
              <NavLinkCard
                to="/search"
                title="Search"
                description="Find and follow other users"
              />
              <NavLinkCard
                to="/follow-requests"
                title="Friend requests"
                description="Review people who want to follow you"
                badge={socialUnreadCount}
              />
              <NavLinkCard
                to={`/profile/${user.id}`}
                title="Profile"
                description={`@${user.username}`}
              />
              <NavLinkCard
                to="/settings"
                title="Settings"
                description="Photo, bio, password, and account"
              />
              <button
                type="button"
                className="nav-logout-button"
                onClick={handleLogout}
              >
                <span>Log out</span>
                <small>Signed in as {user.username}</small>
              </button>
            </>
          ) : (
            <>
              <NavLinkCard
                to="/login"
                title="Login"
                description="I hope you remember your credentials"
              />
              <NavLinkCard
                to="/signup"
                title="Sign up"
                description="Register a new user now"
              />
            </>
          )}
        </nav>
      </aside>

      <main className="app-content">
        <div className="route-stage" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
