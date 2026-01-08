import { MetadataRoute } from 'next'
import { getBlogPosts } from '@/lib/blog'
import { getAllSEOPages } from '@/lib/seo-pages'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://compstudy.tech'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Core Study Pages
    {
      url: `${baseUrl}/start-studying`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/focus`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/live`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/leaderboards`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/curriculum`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/public-curriculum`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/analytics`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/create-room`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Content Pages
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Auth & Legal Pages
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Dynamic SEO pages (timer, stopwatch, pomodoro pages)
  let seoPages: MetadataRoute.Sitemap = []
  try {
    const pages = await getAllSEOPages()
    seoPages = pages.map((page) => ({
      url: `${baseUrl}/tools/${page.slug}`,
      lastModified: new Date(page.updatedAt || page.createdAt),
      changeFrequency: 'weekly' as const,
      priority: page.priority,
    }))
  } catch (error) {
    console.error('Failed to fetch SEO pages for sitemap:', error)
  }

  // Dynamic blog post pages
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const { posts } = await getBlogPosts({ limit: 100, status: 'published' })
    blogPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Failed to fetch blog posts for sitemap:', error)
  }

  return [...staticPages, ...seoPages, ...blogPages]
}
