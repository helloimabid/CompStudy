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
} from "lucide-react";
import StudyTimer from "@/components/StudyTimer";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading || (user && fetchingProfile)) {
    return (
      <main className="relative pt-32 pb-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="relative pt-32 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
          <div>
            <h1 className="text-3xl font-medium text-white mb-2">
              Welcome back,{" "}
              <span className="text-indigo-400">
                {profile?.username || user.name || "Student"}
              </span>
            </h1>
            <p className="text-zinc-500 text-sm">
              Ready to continue your streak?
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-xl border border-white/10 bg-[#0a0a0a]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Flame className="text-orange-500" width={20} />
              </div>
              <div className="text-sm font-medium text-zinc-400">
                Current Streak
              </div>
            </div>
            <div className="text-3xl font-medium text-white">
              {profile?.streak || 0}{" "}
              <span className="text-sm text-zinc-500 font-normal">days</span>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-[#0a0a0a]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Clock className="text-indigo-400" width={20} />
              </div>
              <div className="text-sm font-medium text-zinc-400">
                Total Focus Time
              </div>
            </div>
            <div className="text-3xl font-medium text-white">
              {profile?.totalHours?.toFixed(1) || 0}{" "}
              <span className="text-sm text-zinc-500 font-normal">hours</span>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-[#0a0a0a]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="text-yellow-500" width={20} />
              </div>
              <div className="text-sm font-medium text-zinc-400">Total XP</div>
            </div>
            <div className="text-3xl font-medium text-white">
              {profile?.xp || 0}{" "}
              <span className="text-sm text-zinc-500 font-normal">points</span>
            </div>
          </div>
        </div>

        {/* Solo Session Timer */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-white">Solo Session</h2>
            <a
              href="/focus"
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Open Focus Mode <ArrowRight size={16} />
            </a>
          </div>

          {/* Quick Actions */}
          <h2 className="text-xl font-medium text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/start-studying"
              className="group p-6 rounded-xl border border-white/10 bg-[#0a0a0a] hover:border-indigo-500/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <BookOpen className="text-indigo-400" width={24} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Start Studying
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                Join a room or create your own session.
              </p>
              <div className="flex items-center text-indigo-400 text-sm font-medium">
                Go to Rooms <ArrowRight className="ml-2 w-4 h-4" />
              </div>
            </a>

            <a
              href="/leaderboards"
              className="group p-6 rounded-xl border border-white/10 bg-[#0a0a0a] hover:border-yellow-500/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
                <Trophy className="text-yellow-500" width={24} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Leaderboards
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                Check your global ranking.
              </p>
              <div className="flex items-center text-yellow-500 text-sm font-medium">
                View Rankings <ArrowRight className="ml-2 w-4 h-4" />
              </div>
            </a>

            <a
              href="/community"
              className="group p-6 rounded-xl border border-white/10 bg-[#0a0a0a] hover:border-pink-500/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                <Users className="text-pink-400" width={24} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Community</h3>
              <p className="text-zinc-500 text-sm mb-4">
                Discuss study techniques and find groups.
              </p>
              <div className="flex items-center text-pink-400 text-sm font-medium">
                Join Discussion <ArrowRight className="ml-2 w-4 h-4" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
