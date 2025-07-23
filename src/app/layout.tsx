import React from 'react';
import './globals.css';
import Navbar from '../components/Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow p-4">
            {children}
          </main>
          <footer className="bg-slate-800 p-4 text-center text-white">
            © {new Date().getFullYear()} Top City Tickets. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  );
}