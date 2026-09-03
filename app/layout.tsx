import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { person, seo } from '@/data/portfolioData';
import { SiteChrome } from '@/components/SiteChrome';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600'],
});

// Only the weights the site actually renders — every extra face is another
// font file on the critical path.
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['600'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400'],
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
  themeColor: '#07080b',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

/** Person structured data — helps a recruiter's search surface the right facts. */
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: person.name,
  email: `mailto:${person.email}`,
  url: seo.url,
  jobTitle: 'Technology Project Management, Information Systems Analysis & Implementation, Product Management',
  description: seo.description,
  sameAs: [person.linkedin],
  knowsLanguage: person.languages.map((l) => l.name),
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Afeka Academic College of Engineering' },
    { '@type': 'CollegeOrUniversity', name: 'Tel Aviv College of Practical Engineering' },
  ],
  knowsAbout: [
    'Project Management',
    'PMO',
    'Information Systems',
    'Systems Analysis',
    'Business Analysis',
    'Requirements Analysis',
    'Process Mapping',
    'Workflow Automation',
    'Product Management',
    'Business Intelligence',
    'Python',
    'SQL',
    'Machine Learning',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body className="bg-ink-950 font-sans antialiased">
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
