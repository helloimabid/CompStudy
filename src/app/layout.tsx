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
  title: "CompStudy - Competitive Studying",
  description:
    "Turn isolation into motivation. Join real-time study rooms, climb the global leaderboards, and visualize your progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
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
