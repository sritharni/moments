import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { NotificationProvider } from '@/features/notifications/context/notification-context';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
