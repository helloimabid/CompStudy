"use client";

import { useAuth } from "@/context/AuthContext";
import { useRealtime } from "@/context/RealtimeContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface DropdownProps {
  label: string;
  items: { href: string; label: string }[];
  pathname: string;
}

function NavDropdown({ label, items, pathname }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isActive = items.some((item) => pathname === item.href);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1 transition-colors",
          isActive ? "text-zinc-200" : "hover:text-zinc-200"
        )}
      >
        {label}
        <ChevronDown
          size={12}
          className={clsx("transition-transform", isOpen && "rotate-180")}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 py-2 min-w-[140px] bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  "block px-4 py-2 text-xs transition-colors",
                  pathname === item.href
                    ? "text-zinc-200 bg-white/5"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { user, loading } = useAuth();
  const { activeLearners } = useRealtime();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const studyLinks = [
    { href: "/focus", label: "Focus Mode" },
    { href: "/live", label: "Live Rooms" },
    { href: "/curriculum", label: "My Curriculum" },
    { href: "/public-curriculum", label: "Browse Curricula" },
  ];

  const socialLinks = [
    { href: "/community", label: "Community" },
    { href: "/leaderboards", label: "Leaderboards" },
    { href: "/analytics", label: "Analytics" },
  ];

  const moreLinks = [
    { href: "/features", label: "Features" },
    { href: "/contact", label: "Contact" },
    { href: "/support", label: "☕ Support" },
  ];

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
          className="hidden lg:flex items-center gap-6 text-xs font-medium text-zinc-500"
          suppressHydrationWarning
        >
          <NavDropdown label="Study" items={studyLinks} pathname={pathname} />
          <NavDropdown label="Social" items={socialLinks} pathname={pathname} />
          <NavDropdown label="More" items={moreLinks} pathname={pathname} />
        </div>

        <div className="flex items-center gap-4" suppressHydrationWarning>
          <div
            className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20"
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

          <div className="hidden lg:flex items-center gap-3">
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
            className="lg:hidden text-zinc-400 hover:text-white transition-colors p-2"
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
            className="lg:hidden border-t border-white/5 bg-[#0a0a0a]"
          >
            <div className="px-4 py-6 space-y-6">
              {/* Study Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Study
                </span>
                <div className="space-y-1">
                  {studyLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        "block text-sm font-medium transition-colors py-2 px-3 rounded-lg",
                        pathname === item.href
                          ? "text-zinc-200 bg-white/5"
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Social Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Social
                </span>
                <div className="space-y-1">
                  {socialLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        "block text-sm font-medium transition-colors py-2 px-3 rounded-lg",
                        pathname === item.href
                          ? "text-zinc-200 bg-white/5"
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* More Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  More
                </span>
                <div className="space-y-1">
                  {moreLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        "block text-sm font-medium transition-colors py-2 px-3 rounded-lg",
                        pathname === item.href
                          ? "text-zinc-200 bg-white/5"
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

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
                      <div className="flex gap-2">
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex-1 text-center text-sm font-medium text-zinc-400 border border-white/10 px-4 py-2 rounded-full hover:text-white hover:border-white/20 transition-colors"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/start-studying"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex-1 text-center text-sm font-medium bg-zinc-100 text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
                        >
                          Start Studying
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-center text-sm font-medium bg-zinc-100 text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
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
