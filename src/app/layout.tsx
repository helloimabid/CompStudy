import type { Metadata } from "next";
import {
  Inter,
  Orbitron,
  Quantico,
  Audiowide,
  Electrolize,
} from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { RealtimeProvider } from "@/context/RealtimeContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

// Timer fonts
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const quantico = Quantico({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-quantico",
  display: "swap",
});

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-audiowide",
  display: "swap",
});

const electrolize = Electrolize({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-electrolize",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://compstudy.tech"),
  title: {
    default: "CompStudy - Free Online Study Timer & Pomodoro Focus App",
    template: "%s | CompStudy - Study Timer & Focus App",
  },
  description:
    "Free online study timer with Pomodoro, live study rooms & productivity tracking. Join thousands studying together, climb leaderboards.",
  keywords: [
    "study timer",
    "pomodoro timer",
    "focus timer",
    "online study timer",
    "free study timer",
    "study timer online",
    "pomodoro technique",
    "productivity timer",
    "study timer with music",
    "concentration timer",
    "study session timer",
    "time management app",
    "focus app",
    "study planner",
    "study tracker",
    "academic timer",
    "homework timer",
    "exam preparation timer",
    "study room online",
    "virtual study room",
    "study with me",
    "study together online",
    "collaborative studying",
    "study productivity app",
    "student timer",
    "learning timer",
    "study break timer",
    "focus session",
    "deep work timer",
    "study goals tracker",
    "study statistics",
    "study leaderboard",
    "competitive studying",
    "study motivation app",
  ],
  authors: [{ name: "CompStudy Team" }],
  creator: "CompStudy",
  publisher: "CompStudy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://compstudy.tech",
    title: "CompStudy - Best Free Online Study Timer & Pomodoro Focus App",
    description:
      "Join thousands of students using the best free study timer. Pomodoro technique, live study rooms, goal tracking, and productivity analytics. Start focusing better today!",
    siteName: "CompStudy",
    images: [
      {
        url: "/og-image.png", // Create this image
        width: 1200,
        height: 630,
        alt: "CompStudy - Online Study Timer and Focus App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CompStudy - Free Study Timer & Pomodoro Focus App",
    description:
      "Track your study time, join live study rooms, and boost productivity with our free online timer. Pomodoro technique built-in!",
    images: ["/og-image.png"], // Create this image
    creator: "@compstudy", // Update with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  category: "Education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Favicon links */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#6366f1" />
        
        {/* Zen Dots font from Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Dots&display=swap"
          rel="stylesheet"
        />

        {/* SEO: Structured Data - WebSite Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "CompStudy",
              alternateName: "CompStudy Study Timer",
              url: "https://compstudy.tech",
              description:
                "Free online study timer with Pomodoro technique, live study rooms, and productivity tracking",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://compstudy.app/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* SEO: Structured Data - WebApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "CompStudy",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
                bestRating: "5",
                worstRating: "1",
              },
              description:
                "Free study timer with Pomodoro technique, live study rooms, goal tracking, and productivity analytics for students",
              featureList: [
                "Pomodoro Timer",
                "Study Goal Tracking",
                "Live Study Rooms",
                "Focus Statistics",
                "Study Streak Counter",
                "Leaderboards",
                "Break Reminders",
                "Session History",
              ],
            }),
          }}
        />

        {/* SEO: Structured Data - Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "CompStudy",
              url: "https://compstudy.tech",
              logo: "https://compstudy.tech/logo.png",
              sameAs: [
                "https://twitter.com/compstudy",
                "https://github.com/compstudy",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Support",
                email: "support@compstudy.app",
              },
            }),
          }}
        />

        {/* Google AdSense - Site Verification */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9710571190649081"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={clsx(
          inter.className,
          orbitron.variable,
          quantico.variable,
          audiowide.variable,
          electrolize.variable,
          "text-zinc-400 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 relative min-h-screen"
        )}
        suppressHydrationWarning
      >
        <AuthProvider>
          <RealtimeProvider>
            {/* Dotted Background Layer */}
            <div
              className="fixed inset-0 z-[-1] pointer-events-none"
              suppressHydrationWarning
            >
              <div
                className="absolute inset-0 bg-grid-dots opacity-20"
                suppressHydrationWarning
              ></div>
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]"
                suppressHydrationWarning
              ></div>
            </div>

            {/* Navigation */}
            <Navbar />

            {children}

            {/* Footer CTA */}
            <footer className="py-24 text-center bg-black relative border-t border-white/5">
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none"
                suppressHydrationWarning
              ></div>

              <div
                className="max-w-2xl mx-auto px-6 relative z-10"
                suppressHydrationWarning
              >
                {/* <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-6">
                  Ready to rank up?
                </h2>
                <p className="text-zinc-500 mb-8 text-sm md:text-base">
                  Experience the adrenaline of competitive studying. Stop
                  procrastinating and start competing today.
                </p> */}

                {/* <form className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="bg-zinc-900/50 border border-zinc-800 text-sm text-white px-4 py-3 rounded-md focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-600 w-full"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white text-sm font-medium px-6 py-3 rounded-md hover:bg-indigo-500 transition-colors whitespace-nowrap"
                  >
                    Get Access
                  </button>
                </form> */}

                <div
                  className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-zinc-600"
                  suppressHydrationWarning
                >
                  <div
                    className="flex items-center gap-2"
                    suppressHydrationWarning
                  >
                    <div
                      className="w-16 h-8 flex items-center"
                      suppressHydrationWarning
                    >
                      <a href="/" className="">
                        <img
                          src="/logo.png"
                          alt="CompStudy Logo"
                          suppressHydrationWarning
                          className=" object-contain"
                        />
                      </a>
                    </div>
                    <span>© 2026 CompStudy Inc.</span>
                  </div>
                  <div className="flex gap-6" suppressHydrationWarning>
                    <a
                      href="/privacy"
                      className="hover:text-zinc-400 transition-colors"
                    >
                      Privacy
                    </a>
                    <a
                      href="/terms"
                      className="hover:text-zinc-400 transition-colors"
                    >
                      Terms
                    </a>
                    <a
                      href="#"
                      className="hover:text-zinc-400 transition-colors"
                    >
                      Twitter
                    </a>
                    <a
                      href="#"
                      className="hover:text-zinc-400 transition-colors"
                    >
                      GitHub
                    </a>
                    <a
                      href="#"
                      className="hover:text-zinc-400 transition-colors"
                    >
                      Discord
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
