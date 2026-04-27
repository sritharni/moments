import { createBrowserRouter } from 'react-router-dom';
import { GuestOnlyRoute, LandingRedirect, ProtectedRoute } from '@/app/route-guards';
import { LoginPage } from '@/pages/login-page';
import { AppShell } from '@/layouts/app-shell';
import { ChatPage } from '@/pages/chat-page';
import { FeedPage } from '@/pages/feed-page';
import { ForgotPasswordPage } from '@/pages/forgot-password-page';
import { ResetPasswordPage } from '@/pages/reset-password-page';
import { FollowRequestsPage } from '@/pages/follow-requests-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { NotificationsPage } from '@/pages/notifications-page';
import { ProfilePage } from '@/pages/profile-page';
import { SearchPage } from '@/pages/search-page';
import { SignupPage } from '@/pages/signup-page';
import { VerifyEmailPage } from '@/pages/verify-email-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <LandingRedirect />,
      },
      {
        element: <GuestOnlyRoute />,
        children: [
          {
            path: 'login',
            element: <LoginPage />,
          },
          {
            path: 'signup',
            element: <SignupPage />,
          },
          {
            path: 'verify-email',
            element: <VerifyEmailPage />,
          },
          {
            path: 'forgot-password',
            element: <ForgotPasswordPage />,
          },
          {
            path: 'reset-password',
            element: <ResetPasswordPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'feed',
            element: <FeedPage />,
          },
          {
            path: 'chat',
            element: <ChatPage />,
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
    ],
  },
]);
