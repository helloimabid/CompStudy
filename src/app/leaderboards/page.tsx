"use client";

import { useEffect, useState } from "react";
import { client, databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Trophy, Medal, Crown, Loader2, Flame } from "lucide-react";

interface Profile {
  $id: string;
  username: string;
  totalHours: number;
  streak: number;
  xp: number;
}

export default function LeaderboardsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.orderDesc("totalHours"), Query.limit(50)]
      );
      setProfiles(response.documents as unknown as Profile[]);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    const unsubscribe = client.subscribe(
      `databases.${DB_ID}.collections.${COLLECTIONS.PROFILES}.documents`,
      (response) => {
        // If any profile changes, we refresh the leaderboard to keep it accurate
        // We could optimize this to only update the specific user, but re-sorting is needed anyway
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          )
        ) {
          fetchLeaderboard();
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </main>
    );
  }

  const topThree = profiles.slice(0, 3);
  const rest = profiles.slice(3);

  return (
    <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight mb-4 md:mb-6">
            Global <span className="text-gradient">Leaderboards</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto px-4">
            See where you stand against the most dedicated students in the
            world.
          </p>
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-4 md:gap-6 mb-10 md:mb-16 lg:mb-20">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="order-2 sm:order-1 flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-zinc-700 bg-zinc-800 mb-3 md:mb-4 relative flex items-center justify-center text-xl md:text-2xl font-bold text-zinc-500">
                  {topThree[1].username[0].toUpperCase()}
                  <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-zinc-700 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-bold">
                    #2
                  </div>
                </div>
                <div className="text-white font-medium mb-1 text-sm md:text-base">
                  {topThree[1].username}
                </div>
                <div className="text-zinc-500 text-xs md:text-sm mb-3 md:mb-4">
                  {topThree[1].totalHours.toFixed(1)}h total
                </div>
                <div className="w-28 h-28 md:w-32 md:h-32 bg-zinc-800/50 rounded-t-lg border-t border-x border-white/5 flex items-end justify-center pb-3 md:pb-4">
                  <Medal className="text-zinc-400" width={24} height={24} />
                </div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="order-1 sm:order-2 flex flex-col items-center z-10">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-yellow-500 bg-zinc-800 mb-3 md:mb-4 relative shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center text-2xl md:text-3xl font-bold text-yellow-500">
                  {topThree[0].username[0].toUpperCase()}
                  <Crown
                    className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 text-yellow-500"
                    width={24}
                    height={24}
                  />
                  <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-bold">
                    #1
                  </div>
                </div>
                <div className="text-white font-medium mb-1 text-base md:text-lg">
                  {topThree[0].username}
                </div>
                <div className="text-yellow-500 text-xs md:text-sm mb-3 md:mb-4 font-medium">
                  {topThree[0].totalHours.toFixed(1)}h total
                </div>
                <div className="w-36 h-40 md:w-40 md:h-48 bg-gradient-to-b from-yellow-500/10 to-zinc-900/50 rounded-t-lg border-t border-x border-yellow-500/20 flex items-end justify-center pb-4 md:pb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-yellow-500/5 animate-pulse"></div>
                  <Trophy className="text-yellow-500" width={32} height={32} />
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="order-3 flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-orange-700 bg-zinc-800 mb-3 md:mb-4 relative flex items-center justify-center text-xl md:text-2xl font-bold text-orange-700">
                  {topThree[2].username[0].toUpperCase()}
                  <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-orange-800 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-bold">
                    #3
                  </div>
                </div>
                <div className="text-white font-medium mb-1 text-sm md:text-base">
                  {topThree[2].username}
                </div>
                <div className="text-zinc-500 text-xs md:text-sm mb-3 md:mb-4">
                  {topThree[2].totalHours.toFixed(1)}h total
                </div>
                <div className="w-28 h-20 md:w-32 md:h-24 bg-zinc-800/50 rounded-t-lg border-t border-x border-white/5 flex items-end justify-center pb-3 md:pb-4">
                  <Medal className="text-orange-700" width={24} height={24} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* List */}
        <div className="max-w-3xl mx-auto bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-white/5 text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-6 md:col-span-6">Student</div>
            <div className="col-span-3 text-right">Hours</div>
            <div className="col-span-2 text-right">Streak</div>
          </div>

          {rest.length === 0 && topThree.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-zinc-500 text-sm md:text-base">
              No data available yet.
            </div>
          ) : (
            rest.map((profile, index) => (
              <div
                key={profile.$id}
                className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors"
              >
                <div className="col-span-1 text-center text-zinc-400 font-mono text-xs md:text-sm">
                  #{index + 4}
                </div>
                <div className="col-span-6 flex items-center gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] md:text-xs font-medium text-zinc-400">
                    {profile.username[0].toUpperCase()}
                  </div>
                  <span className="text-zinc-200 font-medium text-xs md:text-sm truncate">
                    {profile.username}
                  </span>
                </div>
                <div className="col-span-3 text-right text-zinc-300 font-mono text-xs md:text-sm">
                  {profile.totalHours.toFixed(1)}h
                </div>
                <div className="col-span-2 text-right text-orange-500 font-medium flex items-center justify-end gap-0.5 md:gap-1 text-xs md:text-sm">
                  {profile.streak} <Flame size={12} className="md:hidden" />
                  <Flame size={14} className="hidden md:inline" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
