import { Outlet, useNavigate } from 'react-router-dom';
import { NavLinkCard } from '@/components/navigation/nav-link-card';
import { useAuth } from '@/features/auth/context/auth-context';
import { useNotifications } from '@/features/notifications/context/notification-context';

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { chatUnreadCount, socialUnreadCount } = useNotifications();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <h1>Moments</h1>
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
        <Outlet />
      </main>
    </div>
  );
}
