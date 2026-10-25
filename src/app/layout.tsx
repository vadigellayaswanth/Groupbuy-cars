import type { Metadata } from 'next';
import './globals.css';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DemoBanner from '@/components/layout/DemoBanner';

export const metadata: Metadata = {
  title: 'GroupBuy Cars — AI Deal Coach for Collective Car Buying',
  description:
    'More Buyers. More Bargaining Power. Better Decisions. Organize scattered car buyer demand into collective campaigns with AI-explained dealership quotes.',
  keywords: [
    'Group Car Buying',
    'AI Deal Coach',
    'Automotive Group Buy',
    'Car Negotiation',
    'Hyderabad Car Deals',
    'Hyundai Creta Group Buy',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="radial-automotive-bg min-h-screen flex flex-col text-gray-100 antialiased selection:bg-cyan-500 selection:text-black">
        {/* Mandatory Hackathon Demo Banner */}
        <DemoBanner />

        {/* Global Navigation */}
        <Suspense fallback={<div className="h-16" />}>
          <Navbar />
        </Suspense>

        {/* Page Content */}
        <main className="flex-1">{children}</main>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}
