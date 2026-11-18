import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Self-hosted so builds never depend on reaching Google Fonts.
const body = localFont({
  src: './fonts/Figtree.woff2',
  variable: '--font-body',
  weight: '300 900',
  display: 'swap',
});

const display = localFont({
  src: './fonts/Gabarito.woff2',
  variable: '--font-display-face',
  weight: '400 900',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TripSplit — split group trip expenses',
    template: '%s · TripSplit',
  },
  description:
    'Log who paid and who shared each cost on a group trip. TripSplit works out the fewest payments to settle up.',
  applicationName: 'TripSplit',
  openGraph: {
    title: 'TripSplit',
    description: 'Everyone paid for something. TripSplit works out who pays whom.',
    type: 'website',
    siteName: 'TripSplit',
  },
};

export const viewport: Viewport = {
  themeColor: '#13324a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
