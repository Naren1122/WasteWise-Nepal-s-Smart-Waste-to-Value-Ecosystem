import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/shared/components/ui/sonner';

export const metadata: Metadata = {
  title: 'WasteWise — Smart Municipal Waste Management',
  description: 'Doorstep waste collection scheduling, live route tracking & digital municipal payments',
  icons: {
    icon: '/logo.webp',
    shortcut: '/logo.webp',
    apple: '/logo.webp',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}

