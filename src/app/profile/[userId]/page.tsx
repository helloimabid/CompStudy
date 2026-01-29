"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  databases,
  DB_ID,
  COLLECTIONS,
  storage,
  BUCKET_ID,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  User,
  Clock,
  Zap,
  Flame,
  Edit,
  ArrowLeft,
  Loader2,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Star,
} from "lucide-react";
import clsx from "clsx";

// export const runtime = "edge";

interface Profile {
  $id: string;
  userId: string;
  username: string;
  bio?: string;
  profilePicture?: string;
  totalHours: number;
  streak: number;
  xp: number;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    thisWeek: 0,
    thisMonth: 0,
    longestSession: 0,
    totalSessions: 0,
  });

  const userId = params?.userId as string;
  const isOwnProfile = user?.$id === userId;

  useEffect(() => {
    loadProfile();
    loadRecentSessions();
    loadStats();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const profiles = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.equal("userId", userId)]
      );

      if (profiles.documents.length > 0) {
        setProfile(profiles.documents[0] as any);
      } else {
        setError("Profile not found");
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.STUDY_SESSIONS,
        [
          Query.equal("userId", userId),
          Query.equal("status", "completed"),
          Query.orderDesc("endTime"),
          Query.limit(10),
        ]
      );
      setRecentSessions(response.documents);
    } catch (error) {
      console.error("Failed to load recent sessions:", error);
    }
  };

  const loadStats = async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [weekSessions, monthSessions, allSessions] = await Promise.all([
        databases.listDocuments(DB_ID, COLLECTIONS.STUDY_SESSIONS, [
          Query.equal("userId", userId),
          Query.equal("status", "completed"),
          Query.greaterThan("endTime", weekAgo.toISOString()),
        ]),
        databases.listDocuments(DB_ID, COLLECTIONS.STUDY_SESSIONS, [
          Query.equal("userId", userId),
          Query.equal("status", "completed"),
          Query.greaterThan("endTime", monthAgo.toISOString()),
        ]),
        databases.listDocuments(DB_ID, COLLECTIONS.STUDY_SESSIONS, [
          Query.equal("userId", userId),
          Query.equal("status", "completed"),
          Query.orderDesc("duration"),
          Query.limit(1),
        ]),
      ]);

      const thisWeek =
        weekSessions.documents.reduce(
          (acc: number, doc: any) => acc + (doc.duration || 0),
          0
        ) / 3600;
      const thisMonth =
        monthSessions.documents.reduce(
          (acc: number, doc: any) => acc + (doc.duration || 0),
          0
        ) / 3600;
      const longestSession =
        allSessions.documents.length > 0
          ? allSessions.documents[0].duration / 60
          : 0;

      setStats({
        thisWeek,
        thisMonth,
        longestSession,
        totalSessions: monthSessions.total,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Profile not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

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
    <main className="min-h-screen px-4 md:px-6 pt-24 pb-20">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          {isOwnProfile && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/profile/edit")}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </motion.button>
          )}
        </div>

        {/* Bento Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {/* Profile Card - Large */}
          <motion.div
            variants={item}
            className="md:col-span-3 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden group hover:border-indigo-500/40 transition-all"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              {/* Profile Picture */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-2xl shadow-indigo-500/20">
                    <div className="w-full h-full rounded-3xl bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                      {profile.profilePicture ? (
                        <img
                          src={profile.profilePicture}
                          alt={profile.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-16 h-16 text-zinc-500" />
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center border-4 border-[#0a0a0a]">
                    <span className="text-xl">✨</span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {profile.username}
                  </h1>
                  {profile.bio ? (
                    <p className="text-zinc-400 text-sm mb-4">{profile.bio}</p>
                  ) : (
                    <p className="text-zinc-600 text-sm mb-4 italic">
                      No bio yet
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium flex items-center gap-1">
                      <Star size={12} /> Level {Math.floor(profile.xp / 100)}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium flex items-center gap-1">
                      <Flame size={12} /> {profile.streak} Day Streak
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-black/30 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">This Week</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.thisWeek.toFixed(1)}
                    <span className="text-sm text-zinc-500 ml-1">h</span>
                  </p>
                </div>
                <div className="bg-black/30 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">This Month</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.thisMonth.toFixed(1)}
                    <span className="text-sm text-zinc-500 ml-1">h</span>
                  </p>
                </div>
                <div className="bg-black/30 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">Longest</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.floor(stats.longestSession)}
                    <span className="text-sm text-zinc-500 ml-1">m</span>
                  </p>
                </div>
                <div className="bg-black/30 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">Sessions</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalSessions}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Total Hours - Featured */}
          <motion.div
            variants={item}
            className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/40 transition-all"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Clock className="text-blue-400" size={24} />
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                Total Hours
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">
                  {profile.totalHours.toFixed(0)}
                </span>
                <span className="text-xl text-zinc-500">h</span>
              </div>
              <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                <TrendingUp size={12} />
                All time focused
              </p>
            </div>
          </motion.div>

          {/* Streak */}
          <motion.div
            variants={item}
            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500/40 transition-all"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-4">
                <Flame className="text-orange-400" size={24} />
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                Day Streak
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">
                  {profile.streak}
                </span>
                <span className="text-xl text-zinc-500">🔥</span>
              </div>
              <p className="text-xs text-orange-400 mt-2">Keep it going!</p>
            </div>
          </motion.div>

          {/* XP */}
          <motion.div
            variants={item}
            className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-yellow-500/40 transition-all"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-4">
                <Zap className="text-yellow-400" size={24} />
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                Experience
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">
                  {profile.xp}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 h-2 rounded-full"
                  style={{ width: `${profile.xp % 100}%` }}
                />
              </div>
              <p className="text-xs text-yellow-400 mt-2">
                Level {Math.floor(profile.xp / 100)}
              </p>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            variants={item}
            className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-400" size={18} />
                <h3 className="font-semibold text-white">Recent Sessions</h3>
              </div>
              <span className="text-xs text-zinc-500">
                {recentSessions.length} total
              </span>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {recentSessions.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 text-sm">
                  No sessions yet
                </div>
              ) : (
                recentSessions.slice(0, 8).map((session) => (
                  <div
                    key={session.$id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
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
                          {Math.floor(session.duration / 60)} min •{" "}
                          {new Date(session.endTime).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </p>
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "text-xs font-medium px-2 py-1 rounded-lg",
                        session.type === "break"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-indigo-500/10 text-indigo-400"
                      )}
                    >
                      {session.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Achievements Placeholder */}
          <motion.div
            variants={item}
            className="lg:col-span-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="text-yellow-500" size={20} />
              <h3 className="font-semibold text-white">Achievements</h3>
            </div>
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Coming soon...</p>
              <p className="text-zinc-600 text-xs mt-1">
                Unlock badges and rewards for your progress
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
