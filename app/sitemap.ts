import type { MetadataRoute } from 'next';
import { projects, seo } from '@/data/portfolioData';

/** Every page in both languages: English at the root, Hebrew under /he. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths: [string, number][] = [['', 1], ...projects.map((p): [string, number] => [`projects/${p.slug}`, 0.8])];

  return paths.flatMap(([path, priority]) => {
    const en = `${seo.url}${path}`;
    const he = `${seo.url}he${path ? `/${path}` : ''}`;
    const alternates = { languages: { en, he } };
    return [
      { url: en, lastModified: now, changeFrequency: 'monthly' as const, priority, alternates },
      { url: he, lastModified: now, changeFrequency: 'monthly' as const, priority: priority - 0.1, alternates },
    ];
  });
}
