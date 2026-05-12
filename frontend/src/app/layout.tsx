import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Conference Radar | Crowe',
  description: 'Crypto event intelligence and BD radar for Crowe',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-full overflow-auto bg-[#f8f9fb]">
          {children}
        </main>
      </body>
    </html>
  );
}
