import { databases, DB_ID, COLLECTIONS } from './appwrite';
import { Query } from 'appwrite';

export interface SEOPage {
  $id: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  subheading: string;
  keywords: string[];
  pageType: 'timer' | 'stopwatch' | 'pomodoro' | 'focus' | 'study' | 'other';
  content?: string;
  faq?: string; // JSON string of { question, answer }[]
  features?: string; // JSON string of string[]
  canonicalUrl?: string;
  ogImage?: string;
  status: 'draft' | 'published' | 'archived';
  priority: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ParsedSEOPage extends Omit<SEOPage, 'faq' | 'features'> {
  faq: { question: string; answer: string }[];
  features: string[];
}

/**
 * Get a single SEO page by slug
 */
export async function getSEOPageBySlug(slug: string): Promise<ParsedSEOPage | null> {
  try {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.SEO_PAGES,
      [
        Query.equal('slug', slug),
        Query.equal('status', 'published'),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const doc = response.documents[0] as unknown as SEOPage;
    return parseSEOPage(doc);
  } catch (error) {
    console.error('Error fetching SEO page:', error);
    return null;
  }
}

/**
 * Get all published SEO pages
 */
export async function getAllSEOPages(): Promise<ParsedSEOPage[]> {
  try {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.SEO_PAGES,
      [
        Query.equal('status', 'published'),
        Query.orderDesc('priority'),
        Query.limit(100)
      ]
    );

    return response.documents.map((doc) => parseSEOPage(doc as unknown as SEOPage));
  } catch (error) {
    console.error('Error fetching SEO pages:', error);
    return [];
  }
}

/**
 * Get all SEO page slugs (for generateStaticParams)
 */
export async function getAllSEOPageSlugs(): Promise<string[]> {
  try {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.SEO_PAGES,
      [
        Query.equal('status', 'published'),
        Query.select(['slug']),
        Query.limit(100)
      ]
    );

    return response.documents.map((doc) => (doc as unknown as { slug: string }).slug);
  } catch (error) {
    console.error('Error fetching SEO page slugs:', error);
    return [];
  }
}

/**
 * Get SEO pages by type
 */
export async function getSEOPagesByType(pageType: SEOPage['pageType']): Promise<ParsedSEOPage[]> {
  try {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.SEO_PAGES,
      [
        Query.equal('pageType', pageType),
        Query.equal('status', 'published'),
        Query.orderDesc('priority'),
        Query.limit(50)
      ]
    );

    return response.documents.map((doc) => parseSEOPage(doc as unknown as SEOPage));
  } catch (error) {
    console.error('Error fetching SEO pages by type:', error);
    return [];
  }
}

/**
 * Parse JSON fields in SEO page
 */
function parseSEOPage(page: SEOPage): ParsedSEOPage {
  let faq: { question: string; answer: string }[] = [];
  let features: string[] = [];

  try {
    if (page.faq) {
      faq = JSON.parse(page.faq);
    }
  } catch (e) {
    console.error('Error parsing FAQ:', e);
  }

  try {
    if (page.features) {
      features = JSON.parse(page.features);
    }
  } catch (e) {
    console.error('Error parsing features:', e);
  }

  return {
    ...page,
    faq,
    features
  };
}
