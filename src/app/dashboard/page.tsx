"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  Trophy,
  Flame,
  Clock,
  ArrowRight,
  Users,
  BookOpen,
  Zap,
  TrendingUp,
  Calendar,
  Target,
  ChevronRight,
  Sparkles,
  DoorOpen,
  Play,
} from "lucide-react";
import StudyTimer from "@/components/StudyTimer";
import UsernameDialog from "@/components/UsernameDialog";
import AdSense from "@/components/AdSense";
import { motion } from "framer-motion";
import clsx from "clsx";
import ProtectedRoute from "@/components/ProtectedRoute";

interface ActiveRoom {
  $id: string;
  roomId: string;
  name: string;
  subject: string;
  activeUsers: number;
  timerState: "idle" | "running" | "paused";
}

function DashboardContent() {
  const { user, loading, logout, needsUsername, setUsernameForOAuth } =
    useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [usernameError, setUsernameError] = useState("");
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchActiveRoom = async () => {
    if (user) {
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.ROOMS,
          [Query.equal("creatorId", user.$id), Query.limit(1)]
        );
        if (response.documents.length > 0) {
          setActiveRoom(response.documents[0] as unknown as ActiveRoom);
        } else {
          setActiveRoom(null);
        }
      } catch (error) {
        console.error("Failed to fetch active room:", error);
      }
    }
  };

  const fetchProfile = async () => {
    if (user) {
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PROFILES,
          [Query.equal("userId", user.$id)]
        );
        if (response.documents.length > 0) {
          setProfile(response.documents[0]);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setFetchingProfile(false);
      }
    }
  };

  const fetchRecentSessions = async () => {
    if (user) {
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          [
            Query.equal("userId", user.$id),
            Query.equal("status", "completed"),
            Query.orderDesc("endTime"),
            Query.limit(5),
          ]
        );
        setRecentSessions(response.documents);
      } catch (error) {
        console.error("Failed to fetch recent sessions:", error);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRecentSessions();
      fetchActiveRoom();
    }
  }, [user]);

  const handleUsernameSubmit = async (username: string) => {
    try {
      setUsernameError("");
      await setUsernameForOAuth(username);
    } catch (err: any) {
      setUsernameError(err.message || "Failed to set username");
      throw err;
    }
  };

  if (loading || (user && fetchingProfile)) {
    return (
      <main className="relative pt-32 pb-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </main>
    );
  }

  if (!user) return null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      <UsernameDialog
        isOpen={needsUsername}
        onSubmit={handleUsernameSubmit}
        error={usernameError}
      />

      <main className="relative pt-24 pb-20 min-h-screen px-4 md:px-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1">
                Welcome back, {profile?.username || user.name || "Student"} ✨
              </h1>
              <p className="text-zinc-500 text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl border border-white/5 text-zinc-400 text-sm hover:bg-white/5 hover:text-white transition-all"
            >
              Sign Out
            </button>
          </div>

          {/* Bento Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-auto"
          >
            {/* Streak - Large Card */}
            <motion.div
              variants={item}
              className="lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent border border-orange-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-orange-500/40 transition-all"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Flame className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                        Current Streak
                      </p>
                      <p className="text-sm text-orange-400">
                        Keep it going! 🔥
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-6xl md:text-7xl font-bold text-white">
                    {profile?.streak || 0}
                  </span>
                  <span className="text-2xl text-zinc-500 font-medium">
                    days
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <TrendingUp size={16} className="text-orange-400" />
                  <span>
                    {profile?.streak > 0
                      ? `${profile.streak} day${
                          profile.streak > 1 ? "s" : ""
                        } strong!`
                      : "Start your streak today"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Total Hours */}
            <motion.div
              variants={item}
              className="bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-all"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
                  <Clock className="text-indigo-400" size={20} />
                </div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                  Total Hours
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {profile?.totalHours?.toFixed(1) || "0.0"}
                  </span>
                  <span className="text-lg text-zinc-500">h</span>
                </div>
              </div>
            </motion.div>

            {/* XP */}
            <motion.div
              variants={item}
              className="bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-yellow-500/40 transition-all"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
                  <Zap className="text-yellow-400" size={20} />
                </div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                  Experience
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {profile?.xp || 0}
                  </span>
                  <span className="text-lg text-zinc-500">XP</span>
                </div>
              </div>
            </motion.div>

            {/* Analytics Link */}
            <motion.div
              variants={item}
              onClick={() => router.push("/analytics")}
              className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <TrendingUp className="text-indigo-400" size={20} />
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                Analytics
              </p>
              <p className="text-sm text-white font-medium">
                View Stats <ArrowRight className="inline w-3 h-3 ml-1" />
              </p>
            </motion.div>

            {/* Curriculum Link */}
            <motion.div
              variants={item}
              onClick={() => router.push("/curriculum")}
              className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <BookOpen className="text-emerald-400" size={20} />
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                Curriculum
              </p>
              <p className="text-sm text-white font-medium">
                Manage Subjects <ArrowRight className="inline w-3 h-3 ml-1" />
              </p>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              variants={item}
              className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-indigo-400" size={18} />
                  <h3 className="font-medium text-white">Recent Activity</h3>
                </div>
                <button
                  onClick={() => router.push("/profile/" + user.$id)}
                  className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {recentSessions.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-sm">
                    No sessions yet. Start studying!
                  </div>
                ) : (
                  recentSessions.slice(0, 3).map((session) => (
                    <div
                      key={session.$id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            session.type === "break"
                              ? "bg-green-500/20"
                              : "bg-indigo-500/20"
                          )}
                        >
                          {session.type === "break" ? "☕" : "🎯"}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">
                            {session.subject || "Study Session"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {Math.floor(session.duration / 60)} minutes
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-600">
                        {new Date(session.endTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Active Room Card */}
            {activeRoom && (
              <motion.div
                variants={item}
                onClick={() => router.push(`/room/${activeRoom.roomId}`)}
                className="lg:col-span-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-3xl p-6 relative overflow-hidden cursor-pointer group hover:border-purple-500/50 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <DoorOpen className="text-purple-400" size={24} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                          Your Active Room
                        </p>
                        <h3 className="text-lg font-semibold text-white">
                          {activeRoom.name || "My Study Room"}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeRoom.timerState === "running" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          Running
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Users size={14} /> {activeRoom.activeUsers || 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      📚 {activeRoom.subject || "General"}
                    </span>
                    <div className="flex items-center text-purple-400 text-sm font-medium">
                      <Play size={14} className="mr-1" /> Enter Room{" "}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              variants={item}
              onClick={() => router.push("/focus")}
              className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden cursor-pointer group hover:border-indigo-500/50 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="text-indigo-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Start Studying Solo
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Begin a new focus session
                </p>
                <div className="flex items-center text-indigo-400 text-sm font-medium">
                  Let's go <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={item}
              onClick={() => router.push("/leaderboards")}
              className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-3xl p-6 relative overflow-hidden cursor-pointer group hover:border-yellow-500/50 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="text-yellow-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Leaderboards
                </h3>
                <p className="text-sm text-zinc-400 mb-4">Check your ranking</p>
                <div className="flex items-center text-yellow-400 text-sm font-medium">
                  View <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={item}
              onClick={() => router.push("/community")}
              className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/30 rounded-3xl p-6 relative overflow-hidden cursor-pointer group hover:border-pink-500/50 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="text-pink-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Community
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Connect with others
                </p>
                <div className="flex items-center text-pink-400 text-sm font-medium">
                  Join <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={item}
              onClick={() => router.push("/live")}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-3xl p-6 relative overflow-hidden cursor-pointer group hover:border-green-500/50 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="text-green-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Live Sessions
                </h3>
                <p className="text-sm text-zinc-400 mb-4">See who's studying</p>
                <div className="flex items-center text-green-400 text-sm font-medium">
                  Watch <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Ad Section - Bottom of Dashboard */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <AdSense adSlot="6403800745" className="text-center" />
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
