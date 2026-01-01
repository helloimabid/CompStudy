"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Clock, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function StartStudyingPage() {
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
      // In a real app, we would validate the room code here
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
            Ready to <span className="text-indigo-400">Focus?</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto px-4">
            Join a collaborative study room or create your own private space.
            Track your progress and stay motivated with peers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Join Room Card */}
          <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#0a0a0a] hover:border-indigo-500/30 transition-colors group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-indigo-500/20 transition-colors">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-medium text-white mb-3 md:mb-4">
              Join a Room
            </h2>
            <p className="text-sm md:text-base text-zinc-400 mb-4 md:mb-6">
              Enter a room code to join an existing study session with your
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
                className="bg-white text-black px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2"
              >
                Join <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Create Room Card */}
          <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#0a0a0a] hover:border-emerald-500/30 transition-colors group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-emerald-500/20 transition-colors">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-medium text-white mb-3 md:mb-4">
              Start a Session
            </h2>
            <p className="text-sm md:text-base text-zinc-400 mb-4 md:mb-6">
              Create a new study room with a Pomodoro timer and invite others to
              join you.
            </p>
            <button
              onClick={createRoom}
              className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium text-sm hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 mt-auto"
            >
              Create New Room <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
