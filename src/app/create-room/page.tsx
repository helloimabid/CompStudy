"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function CreateRoomContent() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [name, setName] = useState("My Study Room");
  const [subject, setSubject] = useState("General");
  const [isStrict, setIsStrict] = useState(false);

  const [pomodoroMin, setPomodoroMin] = useState(25);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);

  const roomId = useMemo(() => Math.random().toString(36).substring(2, 8), []);

  if (loading) {
    return (
      <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </main>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const p = clamp(Number(pomodoroMin) || 25, 1, 600);
    const s = clamp(Number(shortBreakMin) || 5, 1, 600);
    const l = clamp(Number(longBreakMin) || 15, 1, 600);

    const params = new URLSearchParams();
    if (name.trim()) params.set("name", name.trim());
    if (subject.trim()) params.set("subject", subject.trim());
    params.set("strict", isStrict ? "1" : "0");
    params.set("p", String(p));
    params.set("s", String(s));
    params.set("l", String(l));

    router.push(`/room/${roomId}?${params.toString()}`);
  };

  return (
    <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-4 md:mb-6 tracking-tight">
            Create a <span className="text-indigo-400">Room</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto px-4">
            Configure your session settings. Only the room creator can control
            the timer.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#0a0a0a]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Room name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                placeholder="My Study Room"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                placeholder="General"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Pomodoro (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={600}
                value={pomodoroMin}
                onChange={(e) => setPomodoroMin(Number(e.target.value))}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Short break (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={600}
                value={shortBreakMin}
                onChange={(e) => setShortBreakMin(Number(e.target.value))}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Long break (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={600}
                value={longBreakMin}
                onChange={(e) => setLongBreakMin(Number(e.target.value))}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
              />
            </div>

            <div className="flex items-center gap-3 md:mt-7">
              <input
                id="strict"
                type="checkbox"
                checked={isStrict}
                onChange={(e) => setIsStrict(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="strict" className="text-sm text-zinc-300">
                Strict mode
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-white text-black px-4 py-3 rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              Create room <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/start-studying")}
              className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 px-4 py-3 rounded-lg font-medium text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              Back <BookOpen className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="w-4 h-4" />
            Room code will be: <span className="text-zinc-300">{roomId}</span>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function CreateRoomPage() {
  return (
    <ProtectedRoute>
      <CreateRoomContent />
    </ProtectedRoute>
  );
}
