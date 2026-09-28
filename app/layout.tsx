import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { MotionProvider } from '@/components/MotionProvider';
import { SetupHydrator } from '@/components/SetupHydrator';
import { Toast } from '@/components/Toast';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });
const sans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Design Your Workspace · monis.rent',
  description: 'Build your Bali workspace by dragging in a desk, a chair and gear, then rent it.',
};

export const viewport: Viewport = {
  themeColor: '#f7eddf',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh antialiased">
        <MotionProvider>
          <SetupHydrator />
          {children}
          <Toast />
        </MotionProvider>
      </body>
    </html>
  );
}
