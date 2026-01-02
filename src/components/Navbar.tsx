"use client";

import { useAuth } from "@/context/AuthContext";
import { useRealtime } from "@/context/RealtimeContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const { user, loading } = useAuth();
  const { activeLearners } = useRealtime();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
      <div
        className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between"
        suppressHydrationWarning
      >
        <Link
          href="/"
          className="flex items-center gap-2"
          suppressHydrationWarning
        >
          <img
            src="/logo.png"
            alt="CompStudy Logo"
            className="w-24 md:w-32 h-24 md:h-32 object-contain"
            suppressHydrationWarning
          />
        </Link>

        <div
          className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-500"
          suppressHydrationWarning
        >
          <Link
            href="/features"
            className={clsx(
              "transition-colors",
              pathname === "/features" ? "text-zinc-200" : "hover:text-zinc-200"
            )}
          >
            Features
          </Link>
          <Link
            href="/leaderboards"
            className={clsx(
              "transition-colors",
              pathname === "/leaderboards"
                ? "text-zinc-200"
                : "hover:text-zinc-200"
            )}
          >
            Leaderboards
          </Link>
          <Link
            href="/community"
            className={clsx(
              "transition-colors",
              pathname === "/community"
                ? "text-zinc-200"
                : "hover:text-zinc-200"
            )}
          >
            Community
          </Link>
        </div>

        <div className="flex items-center gap-4" suppressHydrationWarning>
          <div
            className="hidden md:flex items-center gap-2 px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20"
            suppressHydrationWarning
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-medium text-indigo-300 tabular-nums">
              {activeLearners} Online
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={`/profile/${user.$id}`}
                    className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Log in
                </Link>
              )}

              {user && (
                <Link
                  href="/start-studying"
                  className="text-xs font-medium bg-zinc-100 text-black px-3 py-1.5 rounded-full hover:bg-zinc-200 transition-colors"
                >
                  Start Studying
                </Link>
              )}
            </>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-zinc-400 hover:text-white transition-colors p-2"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/5 bg-[#0a0a0a]"
          >
            <div className="px-4 py-6 space-y-4">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "block text-sm font-medium transition-colors py-2",
                  pathname === "/features"
                    ? "text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-200"
                )}
              >
                Features
              </Link>
              <Link
                href="/leaderboards"
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "block text-sm font-medium transition-colors py-2",
                  pathname === "/leaderboards"
                    ? "text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-200"
                )}
              >
                Leaderboards
              </Link>
              <Link
                href="/community"
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "block text-sm font-medium transition-colors py-2",
                  pathname === "/community"
                    ? "text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-200"
                )}
              >
                Community
              </Link>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                  <span className="text-xs font-medium text-indigo-300 tabular-nums">
                    {activeLearners} Online
                  </span>
                </div>

                {!loading && (
                  <>
                    {user ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/start-studying"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-center text-sm font-medium bg-zinc-100 text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
                        >
                          Start Studying
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-sm font-medium text-zinc-400 hover:text-white transition-colors py-2"
                      >
                        Log in
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
