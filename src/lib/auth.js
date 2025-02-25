// src/lib/auth.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Create the authentication context
const AuthContext = createContext();

// Mock user database - in production this would be your real database
const USERS = {
  'admin@example.com': { 
    password: 'password123', 
    name: 'Admin User',
    role: 'admin'
  },
  'tabstaff@example.com': { 
    password: 'password123', 
    name: 'Tab Staff',
    role: 'tabstaff'
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('ndl_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('ndl_user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    // In production, this would be a fetch request to your authentication API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple validation with mock data
        const userData = USERS[email.toLowerCase()];
        
        if (userData && userData.password === password) {
          // Create user object (without the password)
          const userInfo = {
            email,
            name: userData.name,
            role: userData.role
          };
          
          // Save to state and localStorage
          setUser(userInfo);
          localStorage.setItem('ndl_user', JSON.stringify(userInfo));
          resolve(userInfo);
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 500); // Simulate network delay
    });
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('ndl_user');
    router.push('/login');
  };

  // Check if user is authorized for a specific role
  const isAuthorized = (requiredRole) => {
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    // Check if the user's role matches the required role
    return user.role === requiredRole;
  };

  // Provide authentication context to children
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthorized, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}