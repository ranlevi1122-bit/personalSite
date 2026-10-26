import type { Locale } from '@/lib/i18n';
import * as en from './portfolioData';
import * as he from './portfolioData.he';

/** The site's content in one language. Both editions share the same shape. */
export type Content = typeof en;

// The Hebrew edition must export everything the English one does.
const heEdition: Record<keyof Content, unknown> = he;

export const getContent = (locale: Locale): Content => (locale === 'he' ? (heEdition as Content) : en);
