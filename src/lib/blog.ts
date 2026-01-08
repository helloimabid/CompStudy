import { databases, DB_ID, COLLECTIONS } from './appwrite';
import { Query, ID } from 'appwrite';

// ============================================
// Types
// ============================================

export interface BlogPost {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  coverImage?: string;
  coverImageId?: string;
  authorName: string;
  authorId?: string;
  readTime: string;
  publishedAt: string;
  updatedAt?: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  viewCount: number;
  metaTitle?: string;
  metaDescription?: string;
}

export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  coverImage?: string;
  coverImageId?: string;
  authorName: string;
  authorId?: string;
  readTime: string;
  publishedAt?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface BlogListOptions {
  limit?: number;
  offset?: number;
  category?: string;
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
  search?: string;
}

// ============================================
// Blog Service Functions
// ============================================

/**
 * Get all published blog posts
 */
export async function getBlogPosts(options: BlogListOptions = {}): Promise<{
  posts: BlogPost[];
  total: number;
}> {
  const {
    limit = 10,
    offset = 0,
    category,
    featured,
    status = 'published',
    search
  } = options;

  const queries: string[] = [
    Query.equal('status', status),
    Query.orderDesc('publishedAt'),
    Query.limit(limit),
    Query.offset(offset)
  ];

  if (category) {
    queries.push(Query.equal('category', category));
  }

  if (featured !== undefined) {
    queries.push(Query.equal('featured', featured));
  }

  if (search) {
    queries.push(Query.search('title', search));
  }

  const response = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.BLOG_POSTS,
    queries
  );

  return {
    posts: response.documents as unknown as BlogPost[],
    total: response.total
  };
}

/**
 * Get featured blog posts
 */
export async function getFeaturedPosts(limit = 2): Promise<BlogPost[]> {
  const response = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.BLOG_POSTS,
    [
      Query.equal('status', 'published'),
      Query.equal('featured', true),
      Query.orderDesc('publishedAt'),
      Query.limit(limit)
    ]
  );

  return response.documents as unknown as BlogPost[];
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const response = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.BLOG_POSTS,
    [Query.equal('slug', slug), Query.limit(1)]
  );

  if (response.documents.length === 0) {
    return null;
  }

  return response.documents[0] as unknown as BlogPost;
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostById(id: string): Promise<BlogPost> {
  const response = await databases.getDocument(
    DB_ID,
    COLLECTIONS.BLOG_POSTS,
    id
  );

  return response as unknown as BlogPost;
}

/**
 * Create a new blog post
 */
export async function createBlogPost(data: BlogPostInput): Promise<BlogPost> {
  const now = new Date().toISOString();

  const response = await databases.createDocument(
    DB_ID,
    COLLECTIONS.BLOG_POSTS,
    ID.unique(),
    {
      ...data,
      publishedAt: data.publishedAt || now,
      status: data.status || 'draft',
      featured: data.featured || false,
      viewCount: 0,
      tags: data.tags || []
    }
  );

  return response as unknown as BlogPost;
}

/**
 * Update a blog post
 */
export async function updateBlogPost(
  id: string,
  data: Partial<BlogPostInput>
): Promise<BlogPost> {
  const response = await databases.updateDocument(
    DB_ID,
    COLLECTIONS.BLOG_POSTS,
    id,
    {
      ...data,
      updatedAt: new Date().toISOString()
    }
  );

  return response as unknown as BlogPost;
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string): Promise<void> {
  await databases.deleteDocument(DB_ID, COLLECTIONS.BLOG_POSTS, id);
}

/**
 * Increment view count for a blog post
 */
export async function incrementViewCount(id: string): Promise<void> {
  const post = await getBlogPostById(id);
  await databases.updateDocument(DB_ID, COLLECTIONS.BLOG_POSTS, id, {
    viewCount: (post.viewCount || 0) + 1
  });
}

/**
 * Get all unique categories
 */
export async function getCategories(): Promise<string[]> {
  const response = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.BLOG_POSTS,
    [Query.equal('status', 'published'), Query.limit(100)]
  );

  const categories = new Set<string>();
  response.documents.forEach((doc) => {
    if ((doc as unknown as BlogPost).category) {
      categories.add((doc as unknown as BlogPost).category);
    }
  });

  return Array.from(categories).sort();
}

/**
 * Get related posts by category (excluding current post)
 */
export async function getRelatedPosts(
  category: string,
  excludeSlug: string,
  limit = 3
): Promise<BlogPost[]> {
  const response = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.BLOG_POSTS,
    [
      Query.equal('status', 'published'),
      Query.equal('category', category),
      Query.notEqual('slug', excludeSlug),
      Query.orderDesc('publishedAt'),
      Query.limit(limit)
    ]
  );

  return response.documents as unknown as BlogPost[];
}

/**
 * Publish a draft post
 */
export async function publishPost(id: string): Promise<BlogPost> {
  return updateBlogPost(id, {
    status: 'published',
    publishedAt: new Date().toISOString()
  });
}

/**
 * Archive a post
 */
export async function archivePost(id: string): Promise<BlogPost> {
  return updateBlogPost(id, { status: 'archived' });
}

/**
 * Calculate read time from content
 */
export function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
