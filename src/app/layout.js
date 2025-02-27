// src/app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import AuthWrapper from '@/components/AuthWrapper';
import NavBar from '@/components/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'NDL Scoring System',
  description: 'Scoring system for the National Debate League',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthWrapper>
            <NavBar />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
          </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}