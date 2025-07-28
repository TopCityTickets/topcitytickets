import React from 'react';
import './globals.css';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../components/providers/AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <AuthProvider>
          <div className="min-h-screen">
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
            <footer className="bg-black/90 backdrop-blur-md p-4 text-center text-gray-300 border-t border-cyan-400/20">
              © {new Date().getFullYear()} Top City Tickets. All rights reserved.
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}