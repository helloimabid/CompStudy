"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  HelpCircle,
  Clock,
  Users,
  Trophy,
  Settings,
  Shield,
  MessageSquare,
  ArrowRight,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import EmailSubscription from "@/components/EmailSubscription";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: HelpCircle,
    color: "indigo",
    items: [
      {
        question: "What is CompStudy?",
        answer:
          "CompStudy is a free online study platform designed to help students focus better and study more effectively. We offer customizable Pomodoro timers, live study rooms where you can study with peers from around the world, competitive leaderboards to track your progress, and comprehensive analytics to understand your study habits.",
      },
      {
        question: "Do I need an account?",
        answer:
          "No, you can use our basic study timer without an account. However, creating a free account unlocks saving study history, joining live rooms, appearing on leaderboards, and syncing across devices.",
      },
      {
        question: "Is it free?",
        answer:
          "Yes! Core features are 100% free including study timers, live rooms, leaderboards, and analytics. We believe study tools should be accessible to all students.",
      },
      {
        question: "What devices work?",
        answer:
          "CompStudy works on any device with a modern browser—desktops, laptops, tablets, and phones. Optimized for Chrome, Firefox, Safari, and Edge.",
      },
    ],
  },
  {
    id: "timer",
    title: "Study Timer",
    icon: Clock,
    color: "emerald",
    items: [
      {
        question: "What is the Pomodoro Technique?",
        answer:
          "A time management method using 25-minute work intervals separated by short breaks. Each interval is called a 'pomodoro.' After four, you take a longer 15-30 minute break. This maintains focus and prevents fatigue.",
      },
      {
        question: "Can I customize durations?",
        answer:
          "Absolutely! Customize focus duration, break lengths, and sessions before long breaks. Many prefer 50-minute sessions for deep work or 15 minutes for quick review.",
      },
      {
        question: "Does it work in background?",
        answer:
          "Yes! The timer continues when you switch tabs or minimize. You'll get audio notifications when sessions end. We recommend keeping it visible for best experience.",
      },
      {
        question: "What timer styles exist?",
        answer:
          "Multiple styles: digital displays, circular progress, minimalist designs. Customize colors and sounds to match your preferences.",
      },
    ],
  },
  {
    id: "rooms",
    title: "Live Rooms",
    icon: Users,
    color: "purple",
    items: [
      {
        question: "What are Live Study Rooms?",
        answer:
          "Virtual spaces to study alongside others in real-time. See who's studying, their focus time, and subjects. Like studying in a library, but from anywhere in the world.",
      },
      {
        question: "How do I join?",
        answer:
          "Create a free account, go to 'Focus' or 'Live' section, browse available rooms. Join public rooms instantly or create private rooms with invite links.",
      },
      {
        question: "Can I study privately with friends?",
        answer:
          "Yes! Create private rooms and share links with friends. Set room goals and track collective study time together.",
      },
      {
        question: "Is there audio/video?",
        answer:
          "Currently rooms focus on presence and text chat for a distraction-free environment. You can see who's studying and send messages, but no audio/video to maintain focus.",
      },
    ],
  },
  {
    id: "leaderboards",
    title: "Leaderboards",
    icon: Trophy,
    color: "amber",
    items: [
      {
        question: "How do leaderboards work?",
        answer:
          "Rankings based on total study time. View daily, weekly, monthly, and all-time rankings. Climb the ranks and compete with students worldwide.",
      },
      {
        question: "What are competitive leagues?",
        answer:
          "A gamified system: Bronze → Silver → Gold → Platinum → Diamond based on weekly hours. Top performers are promoted each week. It adds excitement to studying!",
      },
      {
        question: "How is time tracked?",
        answer:
          "Automatically tracked when using the timer while logged in. Only genuine active study counts—paused time and idle periods don't count.",
      },
      {
        question: "Can I see my statistics?",
        answer:
          "Yes! Your dashboard shows total hours, trends, session history, subject breakdown, and streaks with visualizations to optimize your learning.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & Privacy",
    icon: Shield,
    color: "sky",
    items: [
      {
        question: "How do I create an account?",
        answer:
          "Click 'Login,' sign up with email or Google. Verify your email and you're ready to track study time and join rooms immediately.",
      },
      {
        question: "Can I change my username?",
        answer:
          "Yes, anytime through profile settings. Your username appears on leaderboards and in rooms. Changing it doesn't affect your study history.",
      },
      {
        question: "Is my data secure?",
        answer:
          "We use industry-standard encryption. Your email is never shown publicly—only your username. We don't sell data to third parties.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "Contact us through the Contact page. We'll permanently remove your account and data within 30 days. This action is irreversible.",
      },
    ],
  },
  {
    id: "support",
    title: "Technical Support",
    icon: Settings,
    color: "rose",
    items: [
      {
        question: "Timer not working?",
        answer:
          "Try refreshing or clearing cache. Use Chrome, Firefox, Safari, or Edge with JavaScript enabled. Disable interfering extensions if needed.",
      },
      {
        question: "Can't hear notifications?",
        answer:
          "Grant browser sound permission when prompted. Check device volume and browser settings for compstudy.tech audio permissions.",
      },
      {
        question: "Study time not saving?",
        answer:
          "Ensure you're logged in and have stable internet when sessions end. Try logging out and back in if problems persist.",
      },
      {
        question: "How to report bugs?",
        answer:
          "Use the Contact page with details: what happened, browser/device info, and any error messages. We love feature suggestions too!",
      },
    ],
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(faqCategories[0].id);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;
    const q = searchQuery.toLowerCase();
    return faqCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const activeData =
    filteredCategories.find((c) => c.id === activeCategory) ||
    filteredCategories[0];

  const colorMap: Record<string, { bg: string; text: string; border: string }> =
    {
      indigo: {
        bg: "bg-indigo-500/10",
        text: "text-indigo-400",
        border: "border-indigo-500/20",
      },
      emerald: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
      },
      purple: {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/20",
      },
      amber: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
      },
      sky: {
        bg: "bg-sky-500/10",
        text: "text-sky-400",
        border: "border-sky-500/20",
      },
      rose: {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/20",
      },
    };

  return (
    <main className="min-h-screen bg-[#050505]">
      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/3 w-150 h-100 bg-indigo-500/6 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-100 h-75 bg-purple-500/5 blur-[120px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-white/3 border border-white/6 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
              </div>
              <span className="text-xs text-zinc-600 uppercase tracking-[0.2em]">
                Help Center
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-zinc-500 mb-8">
              Find answers to common questions about CompStudy.
            </p>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#0a0a0a] border border-white/4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-white/8 transition-colors"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Sidebar - Categories */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-4"
            >
              <div className="lg:sticky lg:top-28 space-y-2">
                {(searchQuery ? filteredCategories : faqCategories).map(
                  (category) => {
                    const colors = colorMap[category.color] || colorMap.indigo;
                    const isActive = activeData?.id === category.id;

                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
                          isActive
                            ? "bg-[#0c0c0c] border border-white/6"
                            : "hover:bg-white/2"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isActive ? colors.bg : "bg-white/2"
                          }`}
                        >
                          <category.icon
                            className={`w-5 h-5 ${
                              isActive ? colors.text : "text-zinc-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium ${
                              isActive ? "text-white" : "text-zinc-400"
                            }`}
                          >
                            {category.title}
                          </div>
                          <div className="text-xs text-zinc-700">
                            {category.items.length} questions
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isActive
                              ? "text-zinc-400 rotate-90"
                              : "text-zinc-700"
                          }`}
                        />
                      </button>
                    );
                  }
                )}

                {searchQuery && filteredCategories.length === 0 && (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-5 h-5 text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-500">No results found</p>
                  </div>
                )}
              </div>
            </motion.aside>

            {/* FAQ Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-8"
            >
              {activeData && (
                <div className="space-y-3">
                  {activeData.items.map((item, idx) => {
                    const itemId = `${activeData.id}-${idx}`;
                    const isExpanded = expandedItems.has(itemId);
                    const colors =
                      colorMap[activeData.color] || colorMap.indigo;

                    return (
                      <motion.div
                        key={itemId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="rounded-2xl bg-[#0a0a0a] border border-white/3 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-start gap-4 p-5 text-left group"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center transition-colors ${
                              isExpanded ? colors.bg : "bg-white/2"
                            }`}
                          >
                            <span
                              className={`text-sm font-medium ${
                                isExpanded ? colors.text : "text-zinc-600"
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 pt-1">
                            <span className="text-[15px] font-medium text-zinc-200 group-hover:text-white transition-colors">
                              {item.question}
                            </span>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-all ${
                              isExpanded
                                ? `${colors.bg} rotate-90`
                                : "bg-white/2 group-hover:bg-white/4"
                            }`}
                          >
                            <ChevronRight
                              className={`w-3.5 h-3.5 ${
                                isExpanded ? colors.text : "text-zinc-600"
                              }`}
                            />
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <div className="px-5 pb-5 pl-18">
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                  {item.answer}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 border-t border-white/3">
        <div className="max-w-4xl mx-auto px-6">
          <EmailSubscription
            topic="newsletter"
            title="Get study tips & updates"
            description="Subscribe for productivity tips, strategies, and platform news."
          />
        </div>
      </section>

      {/* Contact CTA */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/8 via-[#0a0a0a] to-purple-500/5 border border-white/4" />

            <div className="relative p-10 md:p-16">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-6">
                    <MessageSquare className="w-5 h-5 text-zinc-400" />
                  </div>
                  <h2 className="text-2xl font-medium text-white mb-3">
                    Still have questions?
                  </h2>
                  <p className="text-zinc-500">
                    Can't find what you're looking for? Our support team is here
                    to help.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-100 transition-all"
                  >
                    Contact Support
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/live"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Join Live Rooms
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
