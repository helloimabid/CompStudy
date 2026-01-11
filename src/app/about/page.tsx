"use client";

import { motion } from "framer-motion";
import {
  Target,
  Users,
  Zap,
  Heart,
  Trophy,
  Clock,
  Globe,
  GraduationCap,
  BarChart2,
  ArrowRight,
  Shield,
  Flame,
  Play,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import EmailSubscription from "@/components/EmailSubscription";
import Head from "next/head";

const values = [
  {
    icon: Target,
    title: "Focus First",
    description:
      "Every feature minimizes distractions and maximizes deep concentration.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Live rooms and leaderboards create supportive, motivating spaces.",
  },
  {
    icon: Zap,
    title: "Science-Backed",
    description: "Built on Pomodoro, spaced repetition, and active recall.",
  },
  {
    icon: Heart,
    title: "Free Forever",
    description: "Core features are completely free. Education for everyone.",
  },
];

const stats = [
  { value: "50K+", label: "Students", sublabel: "Active learners" },
  { value: "1M+", label: "Hours", sublabel: "Time focused" },
  { value: "100+", label: "Countries", sublabel: "Global reach" },
  { value: "4.9", label: "Rating", sublabel: "User score" },
];

const milestones = [
  {
    year: "2024",
    event: "Founded",
    detail: "Started with a simple Pomodoro timer",
  },
  { year: "2025", event: "Live Rooms", detail: "Launched live study rooms" },
  { year: "2026", event: "Global", detail: "Serving students worldwide" },
];

export default function AboutPage() {
  return (
    <>
    <Head>
      <title>About CompStudy - Our Mission & Values</title>
      <meta name="description" content="Learn about CompStudy's mission to make education accessible and effective for students worldwide." />
      <link rel="canonical" href="https://compstudy.tech/about" />
      <meta name="keywords" content="about compstudy, compstudy mission, compstudy values, study app about" />
    </Head>
    <main className="min-h-screen bg-[#050505]">
      {/* Hero Section - Asymmetric Bento */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-125 h-125 bg-indigo-500/8 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-100 h-100 bg-purple-500/6 blur-[120px] rounded-full" />
        </div>

        {/* Grid pattern - very subtle */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6">
          {/* Main Hero Grid */}
          <div className="grid lg:grid-cols-12 gap-4 mb-8">
            {/* Main Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="lg:col-span-8 relative rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-br from-[#0d0d0d] to-[#080808] border border-white/4" />
              <div className="relative p-10 md:p-14">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white/3 border border-white/6 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-zinc-400" />
                  </div>
                  <span className="text-xs text-zinc-600 uppercase tracking-[0.2em]">
                    About CompStudy
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-medium text-white tracking-tight leading-[1.1] mb-6">
                  We help students
                  <span className="block mt-2 text-transparent bg-clip-text bg-linear-to-r from-indigo-300 via-purple-300 to-indigo-300">
                    focus & learn
                  </span>
                </h1>

                <p className="text-lg text-zinc-500 max-w-lg leading-relaxed mb-10">
                  Building the ultimate productivity platform for students who
                  want to achieve their academic goals through focused,
                  effective studying.
                </p>

                <div className="flex items-center gap-4">
                  <Link
                    href="/start-studying"
                    className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-100 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Start Now
                  </Link>
                  <Link
                    href="/features"
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    View features →
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Stats Column */}
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
              {stats.slice(0, 2).map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                  className="relative rounded-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#0a0a0a] border border-white/3" />
                  <div className="relative p-6">
                    <span className="text-3xl md:text-4xl font-light text-white tracking-tight">
                      {stat.value}
                    </span>
                    <div className="mt-2">
                      <p className="text-sm text-zinc-400">{stat.label}</p>
                      <p className="text-xs text-zinc-700">{stat.sublabel}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.slice(2).map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                className="relative rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#0a0a0a] border border-white/3" />
                <div className="relative p-6">
                  <span className="text-3xl font-light text-white tracking-tight">
                    {stat.value}
                  </span>
                  <div className="mt-2">
                    <p className="text-sm text-zinc-400">{stat.label}</p>
                    <p className="text-xs text-zinc-700">{stat.sublabel}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {/* Visual accent cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="relative rounded-2xl overflow-hidden bg-linear-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/10"
            >
              <div className="p-6 flex items-center justify-center h-full">
                <Sparkles className="w-8 h-8 text-indigo-400/40" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/3"
            >
              <div className="p-6 flex items-center justify-center h-full">
                <div className="text-center">
                  <Trophy className="w-6 h-6 text-amber-400/60 mx-auto mb-2" />
                  <p className="text-xs text-zinc-600">Top rated</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section - Offset Grid */}
      <section className="py-24 border-t border-white/3">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Label */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="sticky top-32"
              >
                <span className="text-xs text-zinc-600 uppercase tracking-[0.2em]">
                  Our Story
                </span>
                <h2 className="text-2xl font-medium text-white mt-3">
                  The Mission
                </h2>
              </motion.div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-9"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <p className="text-xl text-zinc-300 leading-relaxed">
                    We started CompStudy because we experienced the struggles of
                    modern studying firsthand.
                  </p>
                  <p className="text-zinc-500 leading-relaxed">
                    Endless distractions, lack of motivation, and the isolation
                    of online learning were holding students back from reaching
                    their potential. We knew there had to be a better way.
                  </p>
                </div>
                <div className="space-y-6">
                  <p className="text-zinc-500 leading-relaxed">
                    Our mission is to create the most effective, engaging, and
                    accessible study platform in the world. We combine proven
                    productivity techniques with modern technology.
                  </p>
                  <p className="text-zinc-500 leading-relaxed">
                    Today, we help students focus deeply, track their progress,
                    and connect with a global community of learners—all
                    completely free.
                  </p>
                </div>
              </div>

              {/* Timeline - Horizontal */}
              <div className="mt-16 pt-12 border-t border-white/4">
                <div className="grid grid-cols-3 gap-6">
                  {milestones.map((m, i) => (
                    <motion.div
                      key={m.year}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="relative"
                    >
                      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-indigo-500/50 to-transparent" />
                      <div className="pt-6">
                        <span className="text-xs text-indigo-400 font-medium">
                          {m.year}
                        </span>
                        <h3 className="text-lg text-white mt-1">{m.event}</h3>
                        <p className="text-sm text-zinc-600 mt-1">{m.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section - Creative Grid */}
      <section className="py-24 border-t border-white/3">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="text-xs text-zinc-600 uppercase tracking-[0.2em]">
              Principles
            </span>
            <h2 className="text-3xl font-medium text-white mt-3">
              What we believe
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#0a0a0a] border border-white/3 group-hover:border-white/6 transition-colors" />
                <div className="relative p-8 flex gap-6">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-white/2 border border-white/4 flex items-center justify-center">
                      <value.icon className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {value.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Overview - Compact Grid */}
      <section className="py-24 border-t border-white/3">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <span className="text-xs text-zinc-600 uppercase tracking-[0.2em]">
                  Platform
                </span>
                <h2 className="text-3xl font-medium text-white mt-3 mb-4">
                  What we offer
                </h2>
                <p className="text-zinc-500 leading-relaxed">
                  A complete suite of tools designed to maximize your study
                  efficiency and keep you motivated.
                </p>
              </motion.div>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: Clock, label: "Smart Timers", color: "indigo" },
                  { icon: Globe, label: "Live Rooms", color: "emerald" },
                  { icon: Trophy, label: "Leaderboards", color: "amber" },
                  { icon: BarChart2, label: "Analytics", color: "purple" },
                  { icon: Flame, label: "Streaks", color: "orange" },
                  { icon: Shield, label: "Focus Mode", color: "sky" },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="group p-5 rounded-xl bg-[#0a0a0a] border border-white/3 hover:border-white/6 transition-all"
                  >
                    <feature.icon
                      className={`w-5 h-5 mb-3 ${
                        feature.color === "indigo"
                          ? "text-indigo-400"
                          : feature.color === "emerald"
                          ? "text-emerald-400"
                          : feature.color === "amber"
                          ? "text-amber-400"
                          : feature.color === "purple"
                          ? "text-purple-400"
                          : feature.color === "orange"
                          ? "text-orange-400"
                          : "text-sky-400"
                      }`}
                    />
                    <span className="text-sm text-zinc-300">
                      {feature.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 border-t border-white/3">
        <div className="max-w-4xl mx-auto px-6">
          <EmailSubscription
            topic="newsletter"
            title="Join our community"
            description="Get weekly study tips, productivity insights, and platform updates."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/3">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-[#0a0a0a] to-purple-500/5 border border-white/4" />
            <div className="relative p-12 md:p-20 text-center">
              <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
                Ready to transform your study habits?
              </h2>
              <p className="text-zinc-500 mb-10 max-w-lg mx-auto">
                Join thousands of students improving their productivity with
                CompStudy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/start-studying"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-100 transition-all"
                >
                  Start Studying Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/features"
                  className="px-8 py-4 rounded-full border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-all"
                >
                  Explore Features
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
    </>
  );
}
