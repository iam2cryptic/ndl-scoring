// src/components/AuthWrapper.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/admin',
  '/admin/tournament'
];

// Routes that require specific roles
const ROLE_PROTECTED_ROUTES = {
  // Only admins can access these routes
  '/admin/users': ['admin']
};

export default function AuthWrapper({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Auth check function
    const checkAuth = () => {
      // If still loading auth state, don't do anything yet
      if (loading) return;
      
      // Check if the current path is a protected route
      const isProtectedRoute = PROTECTED_ROUTES.some(route => 
        pathname.startsWith(route)
      );
      
      // If not protected, allow access
      if (!isProtectedRoute) {
        setAuthorized(true);
        return;
      }
      
      // If protected and not logged in, redirect to login
      if (!user) {
        setAuthorized(false);
        router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      
      // Check for role-based permissions
      for (const [route, roles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
        if (pathname.startsWith(route) && !roles.includes(user.role)) {
          setAuthorized(false);
          router.push('/unauthorized');
          return;
        }
      }
      
      // If all checks pass, authorize
      setAuthorized(true);
    };
    
    checkAuth();
  }, [pathname, user, loading, router]);
  
  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If authorized, render children
  return authorized ? children : null;
}