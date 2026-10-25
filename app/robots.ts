import type { MetadataRoute } from 'next';
import { seo } from '@/data/portfolioData';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/stats', '/api/'] },
    sitemap: `${seo.url}sitemap.xml`,
  };
}
