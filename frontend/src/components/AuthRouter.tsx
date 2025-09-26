import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isTokenValid } from '../utils/auth';

interface AuthRouterProps {
  children: React.ReactNode;
}

const AuthRouter = ({ children }: AuthRouterProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const token = localStorage.getItem('token');
      const currentPath = location.pathname;

      try {
        if (token) {
          const tokenValid = await isTokenValid();
          
          if (tokenValid) {
            // User is authenticated
            if (currentPath === '/' || currentPath === '/login') {
              navigate('/dashboard', { replace: true });
              return;
            }
          } else {
            // Token invalid, remove it
            localStorage.removeItem('token');
            if (currentPath !== '/' && currentPath !== '/login') {
              navigate('/login', { replace: true });
              return;
            }
          }
        } else {
          // No token
          if (currentPath !== '/' && currentPath !== '/login') {
            navigate('/login', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // On network error, if token exists and we're on a protected route, allow access
        if (token && currentPath !== '/' && currentPath !== '/login') {
          // Allow access, assume authenticated
        } else if (!token && currentPath !== '/' && currentPath !== '/login') {
          navigate('/login', { replace: true });
          return;
        }
      }

      setIsLoading(false);
    };

    checkAuthAndRedirect();
  }, [navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthRouter;