import Link from "next/link";
import { Metadata } from "next";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import EmailSubscription from "@/components/EmailSubscription";
import {
  getBlogPosts,
  getFeaturedPosts,
  getCategories,
  BlogPost,
} from "@/lib/blog";

// Metadata - always canonical to /blog regardless of query params
export const metadata: Metadata = {
  title: "Study Tips & Productivity Blog | CompStudy",
  description:
    "Discover proven study techniques, productivity tips, and academic success strategies. Learn about the Pomodoro technique, focus methods, time management, and more on the CompStudy blog.",
  keywords: [
    "study tips",
    "productivity blog",
    "pomodoro technique",
    "study strategies",
    "academic success",
    "focus tips",
    "time management",
    "student productivity",
  ],
  openGraph: {
    title: "Study Tips & Productivity Blog | CompStudy",
    description:
      "Discover proven study techniques, productivity tips, and academic success strategies.",
    type: "website",
  },
  alternates: {
    canonical: "https://compstudy.tech/blog",
  },
};

// Category colors mapping
const categoryColors: Record<
  string,
  { bg: string; text: string; glow: string }
> = {
  Productivity: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    glow: "from-indigo-500/20",
  },
  "Study Tips": {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    glow: "from-purple-500/20",
  },
  Focus: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    glow: "from-emerald-500/20",
  },
  Community: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    glow: "from-sky-500/20",
  },
  Wellness: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    glow: "from-amber-500/20",
  },
};

function getColors(category: string) {
  return categoryColors[category] || categoryColors.Productivity;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Featured Post Card - Large asymmetric design
function FeaturedCard({ post, index }: { post: BlogPost; index: number }) {
  const colors = getColors(post.category);
  const isFirst = index === 0;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group relative block overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0c0c0c] ${
        isFirst ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      {/* Gradient orb */}
      <div
        className={`absolute -top-20 -right-20 w-60 h-60 bg-gradient-radial ${colors.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl`}
      />

      {/* Content */}
      <div
        className={`relative h-full flex flex-col ${
          isFirst ? "p-8 md:p-12" : "p-6 md:p-8"
        }`}
      >
        {/* Top row */}
        <div className="flex items-start justify-between mb-auto">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
          >
            {post.category}
          </span>
          <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
        </div>

        {/* Title and excerpt */}
        <div className={`mt-8 ${isFirst ? "md:mt-16" : ""}`}>
          <h2
            className={`font-medium text-white group-hover:text-indigo-300 transition-colors duration-300 ${
              isFirst
                ? "text-2xl md:text-4xl leading-tight"
                : "text-xl leading-snug"
            }`}
          >
            {post.title}
          </h2>
          <p
            className={`mt-4 text-zinc-500 leading-relaxed ${
              isFirst
                ? "text-base md:text-lg line-clamp-3"
                : "text-sm line-clamp-2"
            }`}
          >
            {post.excerpt}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/[0.04]">
          <span className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
        </div>
      </div>

      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 rounded-3xl border border-white/0 group-hover:border-white/10 transition-colors duration-500 pointer-events-none" />
    </Link>
  );
}

// Regular Post Card - Clean minimal design
function PostCard({ post }: { post: BlogPost }) {
  const colors = getColors(post.category);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative block p-6 rounded-2xl border border-white/[0.04] bg-[#0a0a0a]/50 hover:bg-[#0c0c0c] hover:border-white/[0.08] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${colors.bg} ${colors.text}`}
        >
          {post.category}
        </span>
        <span className="text-xs text-zinc-600">{post.readTime}</span>
      </div>

      <h3 className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors leading-snug mb-2">
        {post.title}
      </h3>

      <p className="text-sm text-zinc-600 line-clamp-2 mb-4">{post.excerpt}</p>

      <span className="text-xs text-zinc-700">
        {formatDate(post.publishedAt)}
      </span>
    </Link>
  );
}

// Category Pill
function CategoryPill({
  category,
  isActive,
}: {
  category: string;
  isActive?: boolean;
}) {
  const colors = getColors(category);

  return (
    <Link
      href={`/blog?category=${encodeURIComponent(category)}`}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        isActive
          ? `${colors.bg} ${colors.text} border border-current/20`
          : "text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/10"
      }`}
    >
      {category}
    </Link>
  );
}

export default async function BlogPage() {
  // Fetch data from Appwrite
  let featuredPosts: BlogPost[] = [];
  let regularPosts: BlogPost[] = [];
  let categories: string[] = [];

  try {
    [featuredPosts, { posts: regularPosts }, categories] = await Promise.all([
      getFeaturedPosts(3),
      getBlogPosts({ limit: 20, featured: false }),
      getCategories(),
    ]);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    // Will show empty state
  }

  const hasNoPosts = featuredPosts.length === 0 && regularPosts.length === 0;

  return (
    <main className="min-h-screen bg-[#050505]">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-900/10 blur-[150px] rounded-full" />
          <div className="absolute top-40 right-0 w-[300px] h-[300px] bg-purple-900/10 blur-[100px] rounded-full" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-600 uppercase tracking-widest">
                  CompStudy
                </p>
                <p className="text-sm text-zinc-400">Blog & Resources</p>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-medium text-white tracking-tight mb-6">
              Insights for
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
                smarter studying
              </span>
            </h1>

            <p className="text-lg text-zinc-500 max-w-xl leading-relaxed">
              Discover proven techniques, productivity strategies, and
              science-backed methods to transform how you learn.
            </p>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12">
              <CategoryPill category="All" isActive />
              {categories.map((cat) => (
                <CategoryPill key={cat} category={cat} />
              ))}
            </div>
          )}
        </div>
      </section>

      {hasNoPosts ? (
        /* Empty State */
        <section className="py-20">
          <div className="max-w-md mx-auto text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-zinc-700" />
            </div>
            <h2 className="text-xl font-medium text-white mb-3">
              No posts yet
            </h2>
            <p className="text-zinc-500 mb-8">
              We're working on some great content. Check back soon or subscribe
              to get notified.
            </p>
            <EmailSubscription
              topic="blog"
              variant="minimal"
              title="Get notified"
              description="Be the first to know when we publish new articles."
            />
          </div>
        </section>
      ) : (
        <>
          {/* Featured Posts - Asymmetric Bento Grid */}
          {featuredPosts.length > 0 && (
            <section className="py-8">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-center gap-3 mb-8">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-zinc-400 font-medium">
                    Featured Articles
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4 auto-rows-fr">
                  {featuredPosts.map((post, i) => (
                    <FeaturedCard key={post.$id} post={post} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* All Posts */}
          {regularPosts.length > 0 && (
            <section className="py-16">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-sm text-zinc-500">All Articles</span>
                  <span className="text-xs text-zinc-700">
                    {regularPosts.length} posts
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularPosts.map((post) => (
                    <PostCard key={post.$id} post={post} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Newsletter Section */}
      <section className="py-20 border-t border-white/[0.03]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0c0c0c] to-[#0a0a0a] border border-white/[0.04] p-10 md:p-16">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/5 blur-[80px] rounded-full" />

            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
                  Stay ahead of the curve
                </h2>
                <p className="text-zinc-500 leading-relaxed">
                  Join thousands of students receiving weekly insights on
                  productivity, study techniques, and learning strategies.
                </p>
              </div>
              <div>
                <EmailSubscription
                  topic="blog"
                  variant="minimal"
                  title=""
                  description=""
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
