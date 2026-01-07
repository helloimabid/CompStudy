"use client";

import { useEffect, useState } from "react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Trophy } from "lucide-react";

interface Profile {
  $id: string;
  username: string;
  profilePicture?: string;
  totalHours: number;
}

export default function LeaderboardWidget() {
  const [topUsers, setTopUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PROFILES,
          [Query.orderDesc("totalHours"), Query.limit(3)]
        );
        setTopUsers(response.documents as unknown as Profile[]);
      } catch (error) {
        console.error("Failed to fetch leaderboard widget:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, []);

  return (
    <div className="bento-card relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group h-full">
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center">
            <Trophy className="text-yellow-500" width={20} />
          </div>
          <div className="text-[10px] font-mono text-zinc-400">ALL TIME</div>
        </div>

        {/* Dynamic Leaderboard List */}
        <div className="flex-1 space-y-2 mb-4 min-h-25">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-zinc-800/50 rounded w-full"
                ></div>
              ))}
            </div>
          ) : topUsers.length === 0 ? (
            <div className="text-xs text-zinc-400 text-center py-4">
              No data yet
            </div>
          ) : (
            topUsers.map((user, index) => (
              <div
                key={user.$id}
                className={`flex items-center gap-2 p-2 rounded border ${
                  index === 0
                    ? "bg-zinc-800/30 border-white/5"
                    : "border-transparent opacity-80"
                }`}
              >
                <div
                  className={`text-[10px] font-bold ${
                    index === 0 ? "text-yellow-500" : "text-zinc-400"
                  }`}
                >
                  #{index + 1}
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                    index === 0 ? "bg-indigo-500" : "bg-zinc-700"
                  }`}
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-xs text-zinc-300 truncate max-w-20">
                  {user.username}
                </div>
                <div className="ml-auto text-[10px] text-zinc-400">
                  {user.totalHours.toFixed(1)}h
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium text-zinc-100 mb-1">
            Competitive Leagues
          </h3>
          <p className="text-sm text-zinc-400">
            Rank up from Bronze to Diamond.
          </p>
        </div>
      </div>
    </div>
  );
}
