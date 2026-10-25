import type { Metadata, Viewport } from 'next';
import { Onest, Source_Serif_4 } from 'next/font/google';
import { person, seo } from '@/data/portfolioData';
import { SiteChrome } from '@/components/SiteChrome';
import './globals.css';

// A sturdy serif with optical sizes for headlines, a clean grotesk for reading.
const display = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz'],
});

const text = Onest({
  subsets: ['latin'],
  variable: '--font-text',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(seo.url),
  title: {
    default: seo.title,
    template: `%s | ${person.name}`,
  },
  description: seo.description,
  keywords: [...seo.keywords],
  authors: [{ name: person.name, url: person.linkedin }],
  creator: person.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: seo.url,
    siteName: seo.siteName,
    title: seo.title,
    description: seo.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: seo.title,
    description: seo.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: '#f3f2f0',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

/** Person structured data, so a search for Ran surfaces the right facts. */
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: person.name,
  email: `mailto:${person.email}`,
  url: seo.url,
  jobTitle: 'Digital Project Manager, AI Implementer and AI Builder',
  description: seo.description,
  sameAs: [person.linkedin, person.github],
  knowsLanguage: [...person.languages],
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Afeka Academic College of Engineering' },
    { '@type': 'CollegeOrUniversity', name: 'Tel Aviv College of Practical Engineering' },
  ],
  knowsAbout: [
    'Digital project management',
    'PMO',
    'Requirements analysis',
    'Process mapping',
    'AI implementation',
    'Claude Code',
    'LLM agents',
    'AutoGen',
    'Python',
    'Next.js',
    'Streamlit',
    'Machine Learning',
  ],
};

/**
 * Marks the document as scripted before first paint, so entrance animations
 * may hide content only when something is there to reveal it again.
 */
const jsFlag = "document.documentElement.classList.add('js')";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          // Structured data is static and authored here, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
