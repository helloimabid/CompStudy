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
import Image from "next/image";
import { AuthProvider } from "@/context/AuthContext";
import { RealtimeProvider } from "@/context/RealtimeContext";
import Navbar from "@/components/Navbar";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { Analytics } from "@vercel/analytics/next";

// Use 'optional' for critical fonts to prevent CLS
const inter = Inter({ 
  subsets: ["latin"],
  display: "optional", // Prevents layout shift
  adjustFontFallback: true,
});

// Timer fonts - use 'swap' for these as they're not immediately visible
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  adjustFontFallback: true,
});

const quantico = Quantico({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-quantico",
  display: "swap",
  adjustFontFallback: true,
});

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-audiowide",
  display: "swap",
  adjustFontFallback: true,
});

const electrolize = Electrolize({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-electrolize",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://compstudy.tech"),
  title: {
    default: "CompStudy - Free Online Study Timer & Pomodoro Focus App",
    template: "%s | CompStudy",
  },
  description:
    "Free online Pomodoro study timer with live study rooms, leaderboards, and focus tracking. Study together, compete with friends, stay motivated. No signup required.",
  keywords: [
    // Primary keywords
    "study timer",
    "free study timer",
    "pomodoro timer",
    "online study timer",
    "study timer online",

    // Long-tail keywords (from your Ahrefs research)
    "study timer aesthetic",
    "pomodoro study timer",
    "aesthetic study timer",
    "2 hour study timer",
    "study timer with breaks",
    "25 minute study timer",

    // Feature-specific
    "online study room",
    "study with friends online",
    "live study room",
    "study together online",
    "study leaderboard",
    "competitive studying",

    // Intent-based
    "focus timer",
    "concentration timer",
    "productivity timer",
    "deep work timer",
    "study motivation app",
    "time management app",
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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
      },
      {
        rel: "android-chrome",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://compstudy.tech",
    title: "CompStudy - Free Study Timer with Live Rooms & Leaderboards",
    description:
      "Join students worldwide using our free Pomodoro study timer. Live study rooms, competitive leaderboards, and focus tracking. No signup needed to start!",
    siteName: "CompStudy",
    images: [
      {
        url: "/opengraph-image", // Uses your dynamic OG image
        width: 1200,
        height: 630,
        alt: "CompStudy - Online Study Timer and Focus App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CompStudy - Free Study Timer & Pomodoro App",
    description:
      "Track study time, join live rooms, compete on leaderboards. Free Pomodoro timer for students. Start now, no signup required!",
    images: ["/opengraph-image"],
    creator: "@compstudy", // Change this when you create the Twitter account
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
    // TODO: Add after setting up Google Search Console
    // google: "YOUR_VERIFICATION_CODE_HERE",
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
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="google-adsense-account" content="ca-pub-9710571190649081" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://sgp.cloud.appwrite.io"
          crossOrigin="anonymous"
        />
        {/* Zen Dots font with display=optional to prevent CLS */}
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Dots&display=optional"
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
              // Removed potentialAction - only add if you have actual search functionality
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
              browserRequirements: "Requires JavaScript. Requires HTML5.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Free study timer with Pomodoro technique, live study rooms, goal tracking, and productivity analytics for students",
              featureList: [
                "Pomodoro Timer",
                "Customizable Study Sessions",
                "Live Study Rooms",
                "Real-time Leaderboards",
                "Focus Statistics & Analytics",
                "Study Streak Counter",
                "Break Reminders",
                "Session History",
                "No Registration Required",
              ],
              screenshot: "https://compstudy.tech/opengraph-image",
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
              logo: "https://compstudy.tech/logo.webp",
              description:
                "Competitive study timer and productivity platform for students",
              foundingDate: "2026",
              // Only add sameAs when you have real social profiles
              sameAs: [
                "https://www.facebook.com/profile.php?id=61585855606865",
                "https://youtube.com/@comp-study?si=NpMuEKv_xzr97txy",
              ],
            }),
          }}
        />

        {/* SEO: Structured Data - SoftwareApplication (Additional) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "CompStudy",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Free online Pomodoro study timer with live study rooms and leaderboards",
            }),
          }}
        />

        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9710571190649081"
          crossOrigin="anonymous"
        />

        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="XMzsitbj00y0dyhzG4Eb1Q"
          async
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
            <div
              className="fixed inset-0 z-[-1] pointer-events-none"
              suppressHydrationWarning
            >
              <div
                className="absolute inset-0 bg-grid-dots opacity-20"
                suppressHydrationWarning
              ></div>
              <div
                className="absolute inset-0 bg-linear-to-t from-[#050505] via-transparent to-[#050505]"
                suppressHydrationWarning
              ></div>
            </div>

            <Navbar />

            {children}
            <PushNotificationManager />
            <Analytics />

            {/* Footer */}
            <footer className="py-24 text-center bg-black relative border-t border-white/5">
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none"
                suppressHydrationWarning
              ></div>

              <div
                className="max-w-7xl mx-auto px-6 relative z-10"
                suppressHydrationWarning
              >
                {/* Footer Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 text-left">
                  <div>
                    <h3 className="text-zinc-200 font-semibold mb-4 text-sm">Study Tools</h3>
                    <ul className="space-y-2 text-xs text-zinc-400">
                      <li><a href="/pomodoro-timer" className="hover:text-zinc-200 transition-colors">Pomodoro Timer</a></li>
                      <li><a href="/study-timer" className="hover:text-zinc-200 transition-colors">Study Timer</a></li>
                      <li><a href="/timer" className="hover:text-zinc-200 transition-colors">Timer</a></li>
                      <li><a href="/25-minute-timer" className="hover:text-zinc-200 transition-colors">25 Minute Timer</a></li>
                      <li><a href="/stopwatch" className="hover:text-zinc-200 transition-colors">Stopwatch</a></li>
                      <li><a href="/stop-watch" className="hover:text-zinc-200 transition-colors">Stop Watch</a></li>
                      <li><a href="/online-stopwatch" className="hover:text-zinc-200 transition-colors">Online Stopwatch</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-zinc-200 font-semibold mb-4 text-sm">Features</h3>
                    <ul className="space-y-2 text-xs text-zinc-400">
                      <li><a href="/pomodoro-timer-online" className="hover:text-zinc-200 transition-colors">Pomodoro Timer Online</a></li>
                      <li><a href="/aesthetic-pomodoro-timer" className="hover:text-zinc-200 transition-colors">Aesthetic Pomodoro</a></li>
                      <li><a href="/pomodoro" className="hover:text-zinc-200 transition-colors">Pomodoro</a></li>
                      <li><a href="/pomofocus" className="hover:text-zinc-200 transition-colors">PomoFocus</a></li>
                      <li><a href="/features" className="hover:text-zinc-200 transition-colors">All Features</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-zinc-200 font-semibold mb-4 text-sm">App Pages</h3>
                    <ul className="space-y-2 text-xs text-zinc-400">
                      <li><a href="/dashboard" className="hover:text-zinc-200 transition-colors">Dashboard</a></li>
                      <li><a href="/leaderboards" className="hover:text-zinc-200 transition-colors">Leaderboards</a></li>
                      <li><a href="/analytics" className="hover:text-zinc-200 transition-colors">Analytics</a></li>
                      <li><a href="/curriculum" className="hover:text-zinc-200 transition-colors">My Curriculum</a></li>
                      <li><a href="/public-curriculum" className="hover:text-zinc-200 transition-colors">Browse Curricula</a></li>
                      <li><a href="/create-room" className="hover:text-zinc-200 transition-colors">Create Room</a></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-zinc-200 font-semibold mb-4 text-sm">About</h3>
                    <ul className="space-y-2 text-xs text-zinc-400">
                      <li><a href="/about" className="hover:text-zinc-200 transition-colors">About Us</a></li>
                      <li><a href="/blog" className="hover:text-zinc-200 transition-colors">Blog</a></li>
                      <li><a href="/faq" className="hover:text-zinc-200 transition-colors">FAQ</a></li>
                      <li><a href="/contact" className="hover:text-zinc-200 transition-colors">Contact</a></li>
                      <li><a href="/support" className="hover:text-zinc-200 transition-colors">Support</a></li>
                    </ul>
                  </div>
                </div>

                <div
                  className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-zinc-400"
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
                        <Image
                          src="/logo.webp"
                          alt="CompStudy Logo"
                          width={64}
                          height={32}
                          className="object-contain"
                        />
                      </a>
                    </div>
                    <span>© 2026 CompStudy</span>
                  </div>
                  <div className="flex gap-6" suppressHydrationWarning>
                    <a
                      href="https://www.facebook.com/profile.php?id=61585855606865"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-zinc-400 transition-colors"
                    >
                      Facebook
                    </a>
                    <a
                      href="https://youtube.com/@comp-study?si=NpMuEKv_xzr97txy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-zinc-400 transition-colors"
                    >
                      Youtube
                    </a>
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
