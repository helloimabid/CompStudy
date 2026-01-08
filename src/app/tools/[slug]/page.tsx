import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSEOPageBySlug,
  getAllSEOPageSlugs,
  ParsedSEOPage,
} from "@/lib/seo-pages";
import StudyTimer from "@/components/StudyTimer";
import { CheckCircle, HelpCircle } from "lucide-react";

export const runtime = "edge";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata dynamically from Appwrite
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSEOPageBySlug(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: {
      canonical: page.canonicalUrl || `https://compstudy.tech/tools/${slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `https://compstudy.tech/tools/${slug}`,
      images: page.ogImage ? [page.ogImage] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
    },
  };
}

// Revalidate every hour for ISR
export const revalidate = 3600;

export default async function SEOPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getSEOPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{page.h1}</h1>
          <p className="text-zinc-400">{page.subheading}</p>
        </div>

        {/* Timer Component */}
        <StudyTimer />

        {/* Features Section */}
        {page.features && page.features.length > 0 && (
          <FeaturesSection features={page.features} />
        )}

        {/* FAQ Section */}
        {page.faq && page.faq.length > 0 && <FAQSection faq={page.faq} />}

        {/* Additional Content */}
        {page.content && <ContentSection content={page.content} />}
      </div>
    </div>
  );
}

function FeaturesSection({ features }: { features: string[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-white mb-6">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800"
          >
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-zinc-300">{feature}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQSection({ faq }: { faq: { question: string; answer: string }[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-white mb-6">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {faq.map((item, index) => (
          <div
            key={index}
            className="p-5 bg-zinc-900/50 rounded-lg border border-zinc-800"
          >
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-2">
                  {item.question}
                </h3>
                <p className="text-zinc-400">{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}

function ContentSection({ content }: { content: string }) {
  return (
    <section className="mt-12">
      <div
        className="prose prose-invert prose-zinc max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}
