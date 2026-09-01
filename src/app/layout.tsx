import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SchemaOrg from '@/components/seo/SchemaOrg';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'THE BRIEF — Serious Journalism for the Modern Reader',
    template: '%s — THE BRIEF',
  },
  description:
    'THE BRIEF delivers clear, concise, and trustworthy news across India, World, Technology, AI, Business, and Science.',
  keywords: ['news', 'India news', 'technology', 'AI', 'business', 'current affairs'],
  authors: [{ name: 'THE BRIEF Editorial Team' }],
  creator: 'THE BRIEF',
  publisher: 'THE BRIEF',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'THE BRIEF',
    title: 'THE BRIEF — Serious Journalism for the Modern Reader',
    description:
      'Clear, concise, and trustworthy news across India, World, Technology, AI, Business, and Science.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'THE BRIEF',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@thebrief',
    creator: '@thebrief',
    title: 'THE BRIEF — Serious Journalism for the Modern Reader',
    description: 'Clear, concise, and trustworthy news across India, World, Technology, AI, Business, and Science.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <SchemaOrg pageType="home" />
      </head>
      <body>
        <div className="page-wrapper">
          <Header />
          <main className="main-content" id="main-content">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
