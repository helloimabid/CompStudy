"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Globe,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function StartStudyingContent() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </main>
    );
  }

  if (!user) return null;

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      router.push(`/room/${roomCode}`);
    }
  };

  const createRoom = () => {
    router.push(`/create-room`);
  };

  return (
    <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-4 md:mb-6 tracking-tight">
            Ready to <span className="text-gradient">Focus?</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto px-4">
            Join a collaborative study room or create your own private space.
            Track your progress and stay motivated with peers.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[280px] md:auto-rows-[300px] max-w-5xl mx-auto">
          {/* Join Room Card - Large */}
          <div className="bento-card md:col-span-2 relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group hover:border-indigo-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10 pointer-events-none"></div>
            <div className="p-6 relative z-20 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center backdrop-blur-md">
                  <Users className="text-indigo-400" width={20} />
                </div>
                <div className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-medium text-indigo-400">
                  Quick Join
                </div>
              </div>

              {/* Mini UI - Room Code Input */}
              <div className="absolute right-4 md:right-6 top-16 w-full max-w-[200px] md:max-w-[240px] opacity-30 md:opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-3 shadow-lg transform translate-x-4 group-hover:translate-x-0 transition-transform duration-500">
                  <div className="text-[10px] text-zinc-500 mb-2">
                    Recent Rooms
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      STUDY-2024
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="w-2 h-2 bg-zinc-600 rounded-full"></span>
                      FOCUS-ROOM
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-medium text-zinc-100 mb-2">
                  Join a Study Room
                </h3>
                <p className="text-xs md:text-sm text-zinc-500 leading-relaxed mb-4 max-w-sm">
                  Enter a room code to join an existing study session with
                  friends or classmates.
                </p>
                <form onSubmit={handleJoinRoom} className="flex gap-3">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="Enter room code"
                    className="flex-1 bg-zinc-900/50 border border-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                  />
                  <button
                    type="submit"
                    className="bg-zinc-100 text-black px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2"
                  >
                    Join <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Solo Study Card */}
          <div className="bento-card relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group hover:border-emerald-500/30 transition-all">
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center">
                  <BookOpen className="text-emerald-400" width={20} />
                </div>
              </div>

              {/* Mini UI - Timer Preview */}
              <div className="flex-1 flex items-center justify-center mb-4">
                <div className="text-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="text-4xl font-mono font-bold text-emerald-400 mb-2">
                    25:00
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Ready to start
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-100 mb-1">
                  Solo Focus
                </h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Start a personal Pomodoro session
                </p>
                <button
                  onClick={() => router.push("/focus")}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                  Start Now <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Create Room Card */}
          <div className="bento-card relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group hover:border-purple-500/30 transition-all">
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center">
                  <Clock className="text-purple-400" width={20} />
                </div>
                <div className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-medium text-purple-400">
                  Host
                </div>
              </div>

              {/* Mini UI - Room Settings */}
              <div className="flex-1 flex items-center justify-center mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="space-y-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-purple-400" /> Pomodoro Timer
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={12} className="text-purple-400" /> Up to 10
                    participants
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={12} className="text-purple-400" /> Public or
                    Private
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-100 mb-1">
                  Create Room
                </h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Start your own study session
                </p>
                <button
                  onClick={createRoom}
                  className="w-full py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
                >
                  Create <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Sessions Card - Wide */}
          <div className="bento-card md:col-span-2 relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group hover:border-amber-500/30 transition-all">
            <div className="absolute top-0 right-0 p-6 z-20">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 border border-white/5 rounded-full px-2 py-1 bg-zinc-900/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Now
              </div>
            </div>
            <div className="p-6 h-full flex flex-col justify-end relative z-10">
              {/* Mini UI - Live Users */}
              <div className="absolute inset-0 flex items-center justify-center px-6 pb-24 opacity-50 group-hover:opacity-80 transition-opacity">
                <div className="flex -space-x-3">
                  {["indigo", "emerald", "amber", "rose", "purple", "cyan"].map(
                    (color, i) => (
                      <div
                        key={i}
                        className={`w-10 h-10 rounded-full bg-${color}-500/20 border-2 border-[#0a0a0a] flex items-center justify-center text-${color}-400 text-xs font-medium`}
                        style={{
                          backgroundColor: `var(--${color}-500-20, rgba(99, 102, 241, 0.2))`,
                          transform: `translateY(${Math.sin(i) * 8}px)`,
                        }}
                      >
                        {["JK", "AR", "MS", "PT", "KL", "+5"][i]}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="relative z-20 pt-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent">
                <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-3">
                  <Globe className="text-amber-400" width={20} />
                </div>
                <h3 className="text-lg font-medium text-zinc-100 mb-1">
                  Browse Live Sessions
                </h3>
                <p className="text-sm text-zinc-500 mb-4 max-w-sm">
                  See who's studying right now and get inspired by the
                  community.
                </p>
                <button
                  onClick={() => router.push("/live")}
                  className="px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-colors inline-flex items-center gap-2"
                >
                  View Live <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function StartStudyingPage() {
  return (
    <ProtectedRoute>
      <StartStudyingContent />
    </ProtectedRoute>
  );
}
