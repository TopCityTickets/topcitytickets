import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import Header from '@/components/layout/header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TopCityTickets',
  description: 'Your premier destination for event tickets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
