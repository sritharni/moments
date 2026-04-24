import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/login-page';
import { AppShell } from '@/layouts/app-shell';
import { ChatPage } from '@/pages/chat-page';
import { FeedPage } from '@/pages/feed-page';
import { FollowRequestsPage } from '@/pages/follow-requests-page';
import { HomePage } from '@/pages/home-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { NotificationsPage } from '@/pages/notifications-page';
import { ProfilePage } from '@/pages/profile-page';
import { SearchPage } from '@/pages/search-page';
import { SignupPage } from '@/pages/signup-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'feed',
        element: <FeedPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
      {
        path: 'profile/:userId',
        element: <ProfilePage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'follow-requests',
        element: <FollowRequestsPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
    ],
  },
]);
