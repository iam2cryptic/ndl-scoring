// src/app/unauthorized/page.js
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <ShieldX className="mx-auto h-16 w-16 text-red-500" />
        
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
        
        <div className="pt-4 flex flex-col space-y-4">
          <button
            onClick={() => router.push('/')}
            className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go Home
          </button>
          
          {user && (
            <button
              onClick={logout}
              className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}