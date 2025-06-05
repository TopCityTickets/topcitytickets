
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import CopyrightYear from '@/components/layout/copyright-year';
import { Suspense } from 'react';
import Loading from './loading';

export const metadata: Metadata = {
  title: 'Top City Tickets',
  description: 'Find and purchase tickets for the best events in your city.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Suspense fallback={<Loading />}>
            {children}
          </Suspense>
        </main>
        <Toaster />
        <footer className="bg-muted text-muted-foreground py-6 text-center">
          <p>&copy; <CopyrightYear /> Top City Tickets. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
