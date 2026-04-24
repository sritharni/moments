import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';

export function LandingRedirect() {
  const { user } = useAuth();

  return <Navigate to={user ? '/feed' : '/login'} replace />;
}

export function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function GuestOnlyRoute() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/feed" replace />;
  }

  return <Outlet />;
}
