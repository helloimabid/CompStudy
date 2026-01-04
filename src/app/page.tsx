"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Flame, Globe, BarChart2, Trophy } from "lucide-react";
import LiveBadge from "@/components/LiveBadge";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import AdSense from "@/components/AdSense";
import { Metadata } from "next";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";

// Note: Metadata export removed as this is now a client component
// SEO metadata is handled in layout.tsx

export default function Home() {
  const [stats, setStats] = useState({
    activeRooms: 0,
    totalHoursStudied: 0,
    totalUsers: 0,
    activeStudents: 0,
  });

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // Get active rooms from Rooms collection
      const activeRooms = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.ROOMS,
        [Query.limit(1000)]
      );

      // Get active sessions
      const activeSessions = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.STUDY_SESSIONS,
        [Query.equal("status", "active"), Query.limit(1000)]
      );

      // Get all profiles for total users and hours
      const profiles = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.limit(5000)]
      );

      // Calculate total hours studied across all users
      const totalHours = profiles.documents.reduce(
        (sum: number, profile: any) => sum + (profile.totalHours || 0),
        0
      );

      setStats({
        activeRooms: activeRooms.total, // Use actual rooms collection count
        totalHoursStudied: Math.floor(totalHours),
        totalUsers: profiles.total,
        activeStudents: activeSessions.total, // Use total count from query
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      // Keep previous stats on error
    }
  };
  return (
    <>
      {/* Hero Section */}
      <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[600px] h-[300px] md:h-[400px] bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center relative z-10">
          {/* Live Badge */}
          <LiveBadge />

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-white tracking-tight mb-4 md:mb-6 leading-[1.1]">
            Study alone,
            <br />
            <span className="text-gradient">compete together.</span>
          </h1>

          <p className="text-base md:text-lg text-zinc-500 max-w-xl mx-auto mb-8 md:mb-10 leading-relaxed font-light px-4">
            Turn isolation into motivation. Join real-time study rooms, climb
            the global leaderboards, and visualize your progress against
            thousands of peers instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/start-studying"
              className="group relative px-6 py-3 rounded-full bg-zinc-100 text-black text-sm font-medium hover:bg-zinc-200 transition-all w-full sm:w-auto overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Join the Competition
                <ArrowRight strokeWidth={1.5} width={16} />
              </span>
            </Link>
            <Link
              href="/live"
              className="px-6 py-3 rounded-full border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-all w-full sm:w-auto bg-[#050505]/50"
            >
              View Live Map
            </Link>
          </div>

          {/* UI Visualization */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent blur-2xl -z-10"></div>

            <div className="glass rounded-xl overflow-hidden shadow-2xl shadow-indigo-900/20 text-left bg-[#0a0a0a]">
              <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between bg-black/40">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                </div>
                <div className="text-[10px] font-mono text-zinc-600">
                  LIVE SESSION • 00:42:18
                </div>
                <div className="w-10"></div>
              </div>

              <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8 bg-[#0a0a0a]/90">
                <div className="md:col-span-2 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-zinc-100 text-lg font-medium tracking-tight">
                        Deep Work: Physics
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">
                        Global Room #882 • High Intensity
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                        Strict Mode
                      </span>
                      <div className="relative inline-block w-8 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input
                          type="checkbox"
                          name="toggle"
                          id="toggle"
                          className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 left-0 border-[#0a0a0a]"
                          defaultChecked
                        />
                        <label
                          htmlFor="toggle"
                          className="toggle-label block overflow-hidden h-4 rounded-full bg-indigo-600 cursor-pointer"
                        ></label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center py-10 border border-zinc-800 rounded-lg bg-zinc-900/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
                      <div className="h-full bg-indigo-500 w-[72%] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    </div>
                    <span className="text-6xl md:text-7xl font-mono font-light text-zinc-100 tracking-tighter tabular-nums">
                      42:18
                    </span>
                    <span className="text-zinc-500 text-xs mt-2 uppercase tracking-widest">
                      Session Time
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-zinc-900/30 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">
                        Current Streak
                      </div>
                      <div className="text-xl font-medium text-white flex items-center gap-2">
                        12 <Flame className="text-orange-500" width={16} />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-900/30 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">
                        XP Gained
                      </div>
                      <div className="text-xl font-medium text-white text-gradient">
                        +450
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-900/30 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">
                        Global Rank
                      </div>
                      <div className="text-xl font-medium text-white">
                        #1,204
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-l border-zinc-800 pl-0 md:pl-8 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Live Peers
                    </h4>
                    <div className="w-2 h-2 rounded-full bg-green-500 live-dot"></div>
                  </div>

                  <div className="space-y-3 flex-1 overflow-hidden">
                    <div className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors cursor-default group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold border border-white/10">
                        JD
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-medium text-zinc-200 truncate">
                            Jane Doe
                          </p>
                          <span className="text-[10px] text-zinc-500">
                            2h 10m
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5">
                          <div className="bg-indigo-500 h-1 rounded-full w-3/4"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded bg-white/5 border border-indigo-500/20">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-white font-bold">
                        ME
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-medium text-indigo-300 truncate">
                            You
                          </p>
                          <span className="text-[10px] text-zinc-400">42m</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5">
                          <div className="bg-indigo-500 h-1 rounded-full w-1/3 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors cursor-default opacity-60">
                      <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-[10px] text-blue-200 font-bold border border-white/10">
                        AK
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-medium text-zinc-200 truncate">
                            Alex K.
                          </p>
                          <span className="text-[10px] text-zinc-500">15m</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5">
                          <div className="bg-zinc-600 h-1 rounded-full w-1/6"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center pt-2">
                      <span className="text-[10px] text-zinc-600">
                        + 124 others in this room
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Ad Section - After Hero */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AdSense adSlot="6403800745" className="text-center" />
      </div>

      {/* Bento Grid Features Section */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-medium text-white tracking-tight mb-4">
              Engineered for focus.
            </h2>
            <p className="text-zinc-500 max-w-xl text-sm md:text-base">
              Everything you need to reach peak performance, wrapped in a
              competitive ecosystem.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Card 1: Global Arenas (Large, Span 2) */}
            <div className="bento-card md:col-span-2 relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10 pointer-events-none"></div>
              <div className="p-6 relative z-20 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center backdrop-blur-md">
                    <Globe className="text-indigo-400" width={20} />
                  </div>
                  <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-[10px] font-medium text-green-400 flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    {stats.activeRooms > 0 ? stats.activeRooms : "—"} Active
                    Rooms
                  </div>
                </div>

                {/* Realistic Mini UI: Room List */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 md:opacity-100 md:w-[280px] p-6 pt-16 flex flex-col gap-3 mask-image-b">
                  <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-3 shadow-lg transform translate-x-4 group-hover:translate-x-0 transition-transform duration-500">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-medium text-white">
                        🔥 MCAT Prep
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        1.2k users
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full">
                      <div className="bg-orange-500 h-1 w-[80%] rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-3 shadow-lg transform translate-x-8 group-hover:translate-x-0 transition-transform duration-500 delay-75">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-medium text-white">
                        ⚛️ Quantum Mech
                      </div>
                      <div className="text-[10px] text-zinc-500">430 users</div>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full">
                      <div className="bg-indigo-500 h-1 w-[45%] rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-3 shadow-lg transform translate-x-12 group-hover:translate-x-0 transition-transform duration-500 delay-150">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-medium text-white">
                        📚 Law School
                      </div>
                      <div className="text-[10px] text-zinc-500">890 users</div>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full">
                      <div className="bg-blue-500 h-1 w-[60%] rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-2">
                    Global Arenas
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
                    Join subject-specific rooms. See who's studying in Tokyo
                    while you work in New York.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Streak (Tall/Standard) */}
            <div className="bento-card relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group">
              <div className="p-6 h-full flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-6">
                  <Flame className="text-orange-500" width={20} />
                </div>

                {/* Realistic Mini UI: Calendar/Streak */}
                <div className="flex-1 flex items-center justify-center mb-4">
                  <div className="grid grid-cols-7 gap-2">
                    <div className="w-6 h-6 rounded bg-zinc-800/50"></div>
                    <div className="w-6 h-6 rounded bg-orange-500/20 text-orange-500 flex items-center justify-center text-[8px]">
                      M
                    </div>
                    <div className="w-6 h-6 rounded bg-orange-500/40 text-orange-500 flex items-center justify-center text-[8px]">
                      T
                    </div>
                    <div className="w-6 h-6 rounded bg-orange-500 text-black flex items-center justify-center text-[8px] font-bold shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                      W
                    </div>
                    <div className="w-6 h-6 rounded bg-zinc-800/50"></div>
                    <div className="w-6 h-6 rounded bg-zinc-800/50"></div>
                    <div className="w-6 h-6 rounded bg-zinc-800/50"></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-1">
                    Consistency Tracker
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Don't break the chain.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Analytics (Wide, Span 2) */}
            <div className="bento-card md:col-span-2 relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group">
              <div className="absolute top-0 right-0 p-6 z-20">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 border border-white/5 rounded-full px-2 py-1 bg-zinc-900/50">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>{" "}
                  Last 7 Days
                </div>
              </div>
              <div className="p-6 h-full flex flex-col justify-end relative z-10">
                {/* Realistic Mini UI: Bar Chart */}
                <div className="absolute inset-0 flex items-end justify-center px-6 pb-24 gap-3 md:gap-6 opacity-80 group-hover:scale-105 transition-transform duration-500 origin-bottom">
                  <div className="w-8 bg-zinc-800/50 h-[30%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                  <div className="w-8 bg-zinc-800/50 h-[50%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                  <div className="w-8 bg-zinc-800/50 h-[40%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                  <div className="w-8 bg-zinc-800/50 h-[70%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                  <div className="w-8 bg-indigo-500/80 h-[85%] rounded-t-sm relative shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-indigo-300 font-medium">
                      8.5h
                    </div>
                  </div>
                  <div className="w-8 bg-zinc-800/50 h-[60%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                  <div className="w-8 bg-zinc-800/50 h-[20%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                </div>

                <div className="relative z-20 pt-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-3">
                    <BarChart2 className="text-indigo-400" width={20} />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-1">
                    Deep Focus Analytics
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Visualize your productivity peaks and optimize your
                    schedule.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4: Leaderboard (Standard) */}
            <LeaderboardWidget />
          </div>
        </div>
      </section>

      {/* Interactive Strip */}
      <section className="border-y border-white/5 bg-[#080808] overflow-hidden py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <img
                src="https://i.pravatar.cc/100?img=1"
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-[#080808] grayscale opacity-70"
              />
              <img
                src="https://i.pravatar.cc/100?img=8"
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-[#080808] grayscale opacity-70"
              />
              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-[#080808] grayscale opacity-70"
              />
              <div className="w-10 h-10 rounded-full border-2 border-[#080808] bg-zinc-800 flex items-center justify-center text-[10px] text-white z-10 font-medium">
                +
                {stats.totalUsers > 0
                  ? (stats.totalUsers / 1000).toFixed(1)
                  : "0"}
                k
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Join the movement
              </p>
              <p className="text-xs text-zinc-600">
                {stats.activeStudents > 0
                  ? `${stats.activeStudents} studying right now`
                  : "Students from around the world"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                {stats.totalHoursStudied > 0
                  ? stats.totalHoursStudied.toLocaleString()
                  : "—"}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">
                Hours Studied
              </div>
            </div>
            <div className="h-8 w-[1px] bg-zinc-800 hidden md:block"></div>
            <div className="text-right hidden md:block">
              <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                {stats.activeRooms > 0 ? stats.activeRooms : "—"}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">
                Active Rooms
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Section - After Interactive Strip */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AdSense adSlot="6403800745" className="text-center" />
      </div>

      {/* SEO Content Section - Hidden but crawlable */}
      <section className="sr-only" aria-hidden="true">
        <div className="max-w-7xl mx-auto px-6">
          <article className="max-w-4xl mx-auto space-y-8 text-zinc-400 text-sm leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                The Best Free Online Study Timer for Students
              </h2>
              <p>
                CompStudy is the ultimate{" "}
                <strong>free online study timer</strong> designed for students,
                professionals, and anyone looking to improve their focus and
                productivity. Our <strong>Pomodoro timer</strong> helps you
                break down study sessions into manageable intervals with
                automatic break reminders, ensuring you maintain peak
                concentration throughout your work.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Why Choose Our Study Timer?
              </h3>
              <p>
                Unlike traditional timers, CompStudy combines the proven{" "}
                <strong>Pomodoro technique</strong> with modern productivity
                features. Track your <strong>study hours</strong>, set specific
                goals for each session, and monitor your progress with detailed
                analytics. Whether you're preparing for exams, working on
                assignments, or building consistent study habits, our timer
                adapts to your needs.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Live Study Rooms & Community
              </h3>
              <p>
                Study doesn't have to be lonely. Join{" "}
                <strong>live study rooms</strong> where thousands of students
                study together in real-time. See what others are working on,
                stay motivated by the community, and compete on global
                leaderboards. Our <strong>virtual study rooms</strong> create
                accountability and make studying more engaging.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Key Features
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Pomodoro Timer:</strong> Customizable work and break
                  intervals
                </li>
                <li>
                  <strong>Goal Tracking:</strong> Set and complete specific
                  objectives each session
                </li>
                <li>
                  <strong>Study Analytics:</strong> Track total hours, streaks,
                  and productivity trends
                </li>
                <li>
                  <strong>Live Sessions:</strong> See real-time study sessions
                  from students worldwide
                </li>
                <li>
                  <strong>Leaderboards:</strong> Compete with peers and stay
                  motivated
                </li>
                <li>
                  <strong>Break Reminders:</strong> Automatic alerts to prevent
                  burnout
                </li>
                <li>
                  <strong>Session History:</strong> Review all past study
                  sessions and progress
                </li>
                <li>
                  <strong>Multiple Timer Modes:</strong> Strict mode for
                  distraction-free studying
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Perfect for Every Study Need
              </h3>
              <p>
                Whether you need a <strong>homework timer</strong>,{" "}
                <strong>exam preparation tracker</strong>, or{" "}
                <strong>deep work session manager</strong>, CompStudy provides
                the tools you need. Students use our timer for:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>College exam preparation and finals week</li>
                <li>High school homework and assignments</li>
                <li>Professional certification studying</li>
                <li>Language learning and practice</li>
                <li>Research and thesis writing</li>
                <li>Online course completion</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Boost Your Productivity Today
              </h3>
              <p>
                Start using the most comprehensive{" "}
                <strong>study timer app</strong> available online. Join over
                10,000 students who have improved their focus, built consistent
                study habits, and achieved their academic goals with CompStudy.
                It's completely free, works on any device, and requires no
                download or installation.
              </p>
            </div>

            <div className="pt-4">
              <p className="text-xs text-zinc-600">
                <strong>Related searches:</strong> study timer online, pomodoro
                timer free, focus timer, study timer with music, concentration
                timer, online study room, study tracker app, productivity timer,
                homework timer, exam timer, study session timer, study planner
                online, focus app for students, time management for students
              </p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
