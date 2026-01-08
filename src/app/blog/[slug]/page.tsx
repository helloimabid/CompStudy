import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Eye,
  Tag,
  Share2,
} from "lucide-react";
import {
  getBlogPostBySlug,
  getRelatedPosts,
  incrementViewCount,
  BlogPost,
} from "@/lib/blog";
import EmailSubscription from "@/components/EmailSubscription";

export const runtime = "edge";

// Category colors
const categoryColors: Record<string, { bg: string; text: string }> = {
  Productivity: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
  "Study Tips": { bg: "bg-purple-500/10", text: "text-purple-400" },
  Focus: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  Community: { bg: "bg-sky-500/10", text: "text-sky-400" },
  Wellness: { bg: "bg-amber-500/10", text: "text-amber-400" },
};

function getColors(category: string) {
  return categoryColors[category] || categoryColors.Productivity;
}

// Generate metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found | CompStudy Blog" };
  }

  return {
    title: post.metaTitle || `${post.title} | CompStudy Blog`,
    description: post.metaDescription || post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

// Related Post Card
function RelatedPostCard({ post }: { post: BlogPost }) {
  const colors = getColors(post.category);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block p-5 rounded-2xl border border-white/[0.04] bg-[#0a0a0a] hover:bg-[#0c0c0c] hover:border-white/[0.08] transition-all"
    >
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${colors.bg} ${colors.text} mb-3`}
      >
        {post.category}
      </span>
      <h3 className="font-medium text-zinc-200 group-hover:text-white transition-colors mb-2 line-clamp-2">
        {post.title}
      </h3>
      <span className="text-xs text-zinc-600">{post.readTime}</span>
    </Link>
  );
}

// Markdown-like content renderer (basic)
function ArticleContent({ content }: { content: string }) {
  // Convert markdown-ish content to HTML-safe rendering
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let inList = false;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-2 mb-6 pl-4">
          {listItems.map((item, i) => (
            <li key={i} className="text-zinc-400 leading-relaxed flex gap-2">
              <span className="text-indigo-400 mt-1.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  const formatInline = (text: string) => {
    return text
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-white font-medium">$1</strong>'
      )
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headings
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={index} className="text-xl font-medium text-white mt-10 mb-4">
          {trimmed.replace("## ", "")}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={index} className="text-lg font-medium text-white mt-8 mb-3">
          {trimmed.replace("### ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      // Skip main title, we render it separately
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      inList = true;
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p
          key={index}
          className="text-zinc-400 leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
        />
      );
    }
  });

  flushList();

  return <div className="prose-custom">{elements}</div>;
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementViewCount(post.$id).catch(() => {});

  // Get related posts
  const relatedPosts = await getRelatedPosts(post.category, post.slug, 3);

  const colors = getColors(post.category);
  const publishedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#050505]">
      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-900/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Category & Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
            >
              {post.category}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-zinc-600">
              <Calendar className="w-3.5 h-3.5" />
              {publishedDate}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-zinc-600">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-medium text-white tracking-tight leading-tight mb-6">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-zinc-400 leading-relaxed mb-8">
            {post.excerpt}
          </p>

          {/* Author & Meta */}
          <div className="flex items-center justify-between py-6 border-y border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {post.authorName}
                </p>
                <p className="text-xs text-zinc-600">Author</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {post.viewCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <Eye className="w-3.5 h-3.5" />
                  {post.viewCount} views
                </span>
              )}
              <button title="share" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Share2 className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <ArticleContent content={post.content} />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-12 pt-8 border-t border-white/[0.04]">
              <Tag className="w-4 h-4 text-zinc-600" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs bg-zinc-900 text-zinc-400 border border-white/[0.04]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 border-t border-white/[0.03]">
        <div className="max-w-3xl mx-auto px-6">
          <EmailSubscription
            topic="blog"
            variant="default"
            title="Enjoyed this article?"
            description="Subscribe to get more study tips and productivity strategies delivered to your inbox."
          />
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 border-t border-white/[0.03]">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-lg font-medium text-white mb-8">
              Related Articles
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedPosts.map((relatedPost) => (
                <RelatedPostCard key={relatedPost.$id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
