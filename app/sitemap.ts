import type { MetadataRoute } from 'next';
import { projects, seo } from '@/data/portfolioData';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: seo.url, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    ...projects.map((p) => ({
      url: `${seo.url}/projects/${p.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
