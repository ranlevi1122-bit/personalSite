import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Frank_Ruhl_Libre, Heebo, Onest, Source_Serif_4 } from 'next/font/google';
import { getContent } from '@/data/content';
import { dirOf, isLocale, locales, type Locale } from '@/lib/i18n';
import { SiteChrome } from '@/components/SiteChrome';
import '../globals.css';

// English: a sturdy serif with optical sizes for headlines, a clean grotesk to read.
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

// Hebrew: a classic Hebrew serif in the same register for headlines, and Heebo to read.
const displayHe = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  variable: '--font-display',
  display: 'swap',
});
const textHe = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-text',
  display: 'swap',
});

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { person, seo } = getContent(locale);
  return {
    metadataBase: new URL(seo.url),
    title: {
      default: seo.title,
      template: `%s | ${person.name}`,
    },
    description: seo.description,
    keywords: [...seo.keywords],
    authors: [{ name: person.name, url: person.linkedin }],
    creator: person.name,
    alternates: {
      canonical: locale === 'he' ? '/he' : '/',
      languages: { en: '/', he: '/he' },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'he' ? 'he_IL' : 'en_US',
      url: locale === 'he' ? `${seo.url}he` : seo.url,
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
}

export const viewport: Viewport = {
  themeColor: '#f3f2f0',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Marks the document as scripted before first paint, so entrance animations
 * may hide content only when something is there to reveal it again.
 */
const jsFlag = "document.documentElement.classList.add('js')";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { person, seo } = getContent(locale);
  const fonts = locale === 'he' ? `${displayHe.variable} ${textHe.variable}` : `${display.variable} ${text.variable}`;

  /** Person structured data, so a search for Ran surfaces the right facts. */
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    email: `mailto:${person.email}`,
    url: seo.url,
    jobTitle: person.title,
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

  return (
    <html lang={locale} dir={dirOf(locale as Locale)} className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          // Structured data is static and authored here, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <SiteChrome locale={locale}>{children}</SiteChrome>
      </body>
    </html>
  );
}
