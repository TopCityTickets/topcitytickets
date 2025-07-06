import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TopCityTickets',
  description: 'Your premier destination for event tickets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {  return (
    <html lang="en" className="dark">      <body className={`${inter.className} bg-black text-white min-h-screen`}>        <AuthProvider>
          <Header />
          <main>
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
