import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // AuthRouter handles the authentication logic now
  // This component just wraps protected content
  return <>{children}</>;
};

export default ProtectedRoute;