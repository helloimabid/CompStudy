"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  BookOpen,
  Globe,
  Lock,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import clsx from "clsx";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function CreateRoomContent() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [name, setName] = useState("My Study Room");
  const [subject, setSubject] = useState("General");
  const [curriculumId, setCurriculumId] = useState("");
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [isStrict, setIsStrict] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [copied, setCopied] = useState(false);

  const [pomodoroMin, setPomodoroMin] = useState(25);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);

  const roomId = useMemo(() => Math.random().toString(36).substring(2, 8), []);
  const joinCode = useMemo(
    () => Math.random().toString(36).substring(2, 8).toUpperCase(),
    []
  );

  useEffect(() => {
    if (user) {
      fetchCurriculums();
    }
  }, [user]);

  const fetchCurriculums = async () => {
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.CURRICULUM,
        [Query.equal("userId", user.$id)]
      );
      setCurriculums(response.documents);
    } catch (error) {
      console.error("Error fetching curriculums:", error);
    }
  };

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
    if (curriculumId) params.set("curriculumId", curriculumId);
    params.set("strict", isStrict ? "1" : "0");
    params.set("p", String(p));
    params.set("s", String(s));
    params.set("l", String(l));
    params.set("visibility", visibility);

    // For private rooms, use the joinCode as the roomId (one code to share)
    const finalRoomId = visibility === "private" ? joinCode : roomId;

    router.push(`/room/${finalRoomId}?${params.toString()}`);
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
              <div className="space-y-2">
                {curriculums.length > 0 ? (
                  <select
                    value={curriculumId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setCurriculumId(id);
                      if (id) {
                        const selected = curriculums.find((c) => c.$id === id);
                        if (selected) setSubject(selected.name);
                      } else {
                        setSubject("General");
                      }
                    }}
                    className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                  >
                    <option value="">Custom / General</option>
                    {curriculums.map((c) => (
                      <option key={c.$id} value={c.$id}>
                        📚 {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5">
                    <span className="text-zinc-500 text-sm">
                      No curriculum subjects
                    </span>
                    <a
                      href="/curriculum"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      + Add subjects
                    </a>
                  </div>
                )}
                {!curriculumId && (
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                    placeholder="Enter custom subject..."
                  />
                )}
              </div>
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

          {/* Visibility Section */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <label className="block text-sm text-zinc-400 mb-3">
              Room Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={clsx(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all",
                  visibility === "public"
                    ? "bg-indigo-500/10 border-indigo-500/50 text-white"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <Globe className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Public</p>
                  <p className="text-xs text-zinc-500">Anyone can join</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={clsx(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all",
                  visibility === "private"
                    ? "bg-purple-500/10 border-purple-500/50 text-white"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                <Lock className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Private</p>
                  <p className="text-xs text-zinc-500">Join code required</p>
                </div>
              </button>
            </div>

            {/* Join Code Preview for Private Rooms */}
            {visibility === "private" && (
              <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <p className="text-xs text-zinc-400 mb-2">
                  Room code (share this to let others join):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-black/30 rounded-lg text-lg font-mono text-purple-400 tracking-widest">
                    {joinCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(joinCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
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
            Room Code:{" "}
            <span
              className={
                visibility === "private"
                  ? "text-purple-400 font-mono"
                  : "text-zinc-300"
              }
            >
              {visibility === "private" ? joinCode : roomId}
            </span>
            {visibility === "private" && (
              <>
                <span className="mx-2">•</span>
                <Lock className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400">Private</span>
              </>
            )}
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
