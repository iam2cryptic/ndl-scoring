'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // Skip rendering on judge pages or if it's a direct API call
  if (pathname.startsWith('/judge/') || pathname.startsWith('/api/')) {
    return null;
  }

  // Define menu items based on auth state
  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Speaker Standings', href: '/standings' },
  ];

  // Admin menu items
  const adminMenuItems = [
    { label: 'Tournament Management', href: '/admin/tournament' },
    { label: 'Speaker Management', href: '/admin/speakers' },
    { label: 'Create Tournament', href: '/admin/tournament/create' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-lg">NDL Scoring</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {user && (
                <div className="relative inline-block text-left h-full">
                  <button
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname.startsWith('/admin')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Admin
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  
                  {adminMenuOpen && (
                    <div 
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                      onMouseLeave={() => setAdminMenuOpen(false)}
                    >
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {adminMenuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                            onClick={() => setAdminMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Login
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname === item.href
                    ? 'border-blue-500 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {user && (
              <>
                <div className="border-t border-gray-200 pt-4">
                  <div className="px-4 font-medium text-gray-500">Admin</div>
                  {adminMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div>
                <div className="px-4 py-3">
                  <p className="text-base font-medium text-gray-800">{user.name}</p>
                  <p className="text-sm font-medium text-gray-500">{user.email}</p>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3">
                <Link
                  href="/login"
                  className="block text-blue-600 hover:text-blue-800"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}