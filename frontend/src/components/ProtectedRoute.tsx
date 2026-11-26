import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRole: Role;
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const { isAuthenticated, user, verifying } = useAuth();

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#F6F8F6] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1B5E42] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== allowedRole) {
    const fallback = user.role === 'ROLE_ADMIN' ? '/admin/analytics' : '/shop';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
