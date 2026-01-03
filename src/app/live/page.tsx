"use client";

import { useEffect, useState } from "react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  User,
  Clock,
  Target,
  BookOpen,
  Loader2,
  Eye,
  X,
  Play,
  Pause,
  CheckSquare,
  Square,
  Timer,
  Coffee,
  Zap,
  TrendingUp,
  Users,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface GoalItem {
  id: string;
  text: string;
  completed: boolean;
}

interface StudySession {
  $id: string;
  userId: string;
  username?: string;
  subject: string;
  goal: string;
  startTime: string;
  status: string;
  type: "focus" | "break";
  duration?: number; // target duration in seconds (for timer mode)
  isPublic: boolean;
  // Profile info
  profilePic?: string;
  streak?: number;
  totalHours?: number;
}

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for live duration display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Fetch active public sessions
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          [
            Query.equal("status", "active"),
            Query.equal("isPublic", true),
            Query.orderDesc("startTime"),
            Query.limit(50),
          ]
        );

        const sessionDocs = response.documents as unknown as StudySession[];

        // Fetch profiles for these users to get usernames and stats
        const userIds = [...new Set(sessionDocs.map((s) => s.userId))];
        if (userIds.length > 0) {
          const profiles = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.PROFILES,
            [Query.equal("userId", userIds)]
          );

          const userMap = new Map();
          profiles.documents.forEach((p: any) => {
            userMap.set(p.userId, {
              username: p.username,
              profilePic: p.profilePic,
              streak: p.streak || 0,
              totalHours: p.totalHours || 0,
            });
          });

          const sessionsWithInfo = sessionDocs.map((s) => ({
            ...s,
            username: userMap.get(s.userId)?.username || "Student",
            profilePic: userMap.get(s.userId)?.profilePic,
            streak: userMap.get(s.userId)?.streak || 0,
            totalHours: userMap.get(s.userId)?.totalHours || 0,
          }));
          setSessions(sessionsWithInfo);
        } else {
          setSessions(sessionDocs);
        }
      } catch (error) {
        console.error("Failed to fetch live sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    // Poll every 10 seconds for more real-time feel
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const getDuration = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const diff = Math.floor((currentTime - start) / 1000); // seconds
    return diff;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const parseGoals = (goalString: string): GoalItem[] => {
    if (!goalString) return [];
    try {
      const parsed = JSON.parse(goalString);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  };

  const getProgress = (session: StudySession) => {
    if (!session.duration || session.duration === 0) return null;
    const elapsed = getDuration(session.startTime);
    return Math.min((elapsed / session.duration) * 100, 100);
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Globe className="w-10 h-10 text-indigo-400" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 items-center justify-center text-[8px] font-bold text-white">
                  {sessions.length}
                </span>
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight">
              Live <span className="text-indigo-400">Study Sessions</span>
            </h1>
          </div>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Watch others study in real-time. Get inspired and stay motivated
            together.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-6 mb-10 text-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <Users size={16} className="text-green-400" />
            <span>
              <span className="text-white font-medium">{sessions.length}</span>{" "}
              studying now
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <Zap size={16} className="text-amber-400" />
            <span>
              <span className="text-white font-medium">
                {Math.round(
                  sessions.reduce(
                    (acc, s) => acc + getDuration(s.startTime),
                    0
                  ) / 60
                )}
              </span>{" "}
              total minutes
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-lg mb-2">
              No public sessions active right now
            </p>
            <p className="text-zinc-600 text-sm">
              Be the first to start a public study session!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session, idx) => {
              const elapsed = getDuration(session.startTime);
              const progress = getProgress(session);
              const goals = parseGoals(session.goal);
              const completedGoals = goals.filter((g) => g.completed).length;

              return (
                <motion.div
                  key={session.$id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedSession(session)}
                  className={clsx(
                    "bg-[#0a0a0a] border rounded-2xl p-5 transition-all cursor-pointer group relative overflow-hidden",
                    session.type === "break"
                      ? "border-green-500/20 hover:border-green-500/40"
                      : "border-indigo-500/20 hover:border-indigo-500/40"
                  )}
                >
                  {/* Live Indicator */}
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-medium uppercase tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      Live
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {session.username?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div
                        className={clsx(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white",
                          session.type === "break"
                            ? "bg-green-500"
                            : "bg-indigo-500"
                        )}
                      >
                        {session.type === "break" ? (
                          <Coffee size={10} />
                        ) : (
                          <BookOpen size={10} />
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        {session.username}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {session.streak && session.streak > 0 && (
                          <span className="flex items-center gap-0.5">
                            🔥 {session.streak} day streak
                          </span>
                        )}
                        {session.totalHours && session.totalHours > 0 && (
                          <span>{Math.round(session.totalHours)}h total</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Session Info */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={clsx(
                            "text-xs font-medium uppercase tracking-wider",
                            session.type === "break"
                              ? "text-green-400"
                              : "text-indigo-400"
                          )}
                        >
                          {session.type === "break"
                            ? "☕ Break"
                            : "🎯 Focus Session"}
                        </span>
                      </div>
                      <h4 className="text-white font-medium text-lg">
                        {session.subject || "General Study"}
                      </h4>
                    </div>

                    {/* Timer Display */}
                    <div className="bg-black/30 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-xs">Elapsed</span>
                        {session.duration && session.duration > 0 && (
                          <span className="text-zinc-500 text-xs">
                            Target: {formatDuration(session.duration)}
                          </span>
                        )}
                      </div>
                      <div
                        className={clsx(
                          "text-2xl font-mono font-bold tracking-wider mt-1",
                          session.type === "break"
                            ? "text-green-400"
                            : "text-indigo-400"
                        )}
                      >
                        {formatTime(elapsed)}
                      </div>
                      {/* Progress Bar */}
                      {progress !== null && (
                        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              "h-full rounded-full transition-all duration-1000",
                              session.type === "break"
                                ? "bg-green-500"
                                : "bg-indigo-500"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Goals Preview */}
                    {goals.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">Goals</span>
                          <span className="text-xs text-zinc-400">
                            {completedGoals}/{goals.length} done
                          </span>
                        </div>
                        <div className="space-y-1">
                          {goals.slice(0, 2).map((goal) => (
                            <div
                              key={goal.id}
                              className={clsx(
                                "flex items-center gap-2 text-xs",
                                goal.completed
                                  ? "text-zinc-500 line-through"
                                  : "text-zinc-300"
                              )}
                            >
                              {goal.completed ? (
                                <CheckSquare
                                  size={12}
                                  className="text-green-500"
                                />
                              ) : (
                                <Square size={12} className="text-zinc-600" />
                              )}
                              <span className="truncate">{goal.text}</span>
                            </div>
                          ))}
                          {goals.length > 2 && (
                            <span className="text-xs text-zinc-600">
                              +{goals.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
                      <Eye size={14} />
                      View Session
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSession(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-50 flex items-center justify-center"
            >
              <SessionDetailView
                session={selectedSession}
                onClose={() => setSelectedSession(null)}
                currentTime={currentTime}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

// Detailed Session View Component
function SessionDetailView({
  session,
  onClose,
  currentTime,
}: {
  session: StudySession;
  onClose: () => void;
  currentTime: number;
}) {
  const elapsed = Math.floor(
    (currentTime - new Date(session.startTime).getTime()) / 1000
  );
  const progress =
    session.duration && session.duration > 0
      ? Math.min((elapsed / session.duration) * 100, 100)
      : null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} minutes`;
  };

  const goals = (() => {
    if (!session.goal) return [];
    try {
      const parsed = JSON.parse(session.goal);
      if (Array.isArray(parsed)) return parsed as GoalItem[];
      return [];
    } catch {
      return [];
    }
  })();

  const completedGoals = goals.filter((g) => g.completed).length;
  const remaining = session.duration
    ? Math.max(session.duration - elapsed, 0)
    : 0;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div
        className={clsx(
          "p-6 border-b border-white/5 relative",
          session.type === "break"
            ? "bg-gradient-to-br from-green-500/10 to-transparent"
            : "bg-gradient-to-br from-indigo-500/10 to-transparent"
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
              {session.username?.[0]?.toUpperCase() || "S"}
            </div>
            <div
              className={clsx(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white",
                session.type === "break" ? "bg-green-500" : "bg-indigo-500"
              )}
            >
              {session.type === "break" ? (
                <Coffee size={12} />
              ) : (
                <BookOpen size={12} />
              )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {session.username}
            </h2>
            <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
              {session.streak && session.streak > 0 && (
                <span className="flex items-center gap-1">
                  🔥 {session.streak} day streak
                </span>
              )}
              {session.totalHours && session.totalHours > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {Math.round(session.totalHours)}h studied
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Badge */}
        <div className="absolute top-4 left-4">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Now
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Session Type & Subject */}
        <div>
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider mb-3",
              session.type === "break"
                ? "bg-green-500/10 text-green-400"
                : "bg-indigo-500/10 text-indigo-400"
            )}
          >
            {session.type === "break" ? (
              <>
                <Coffee size={12} /> Break Time
              </>
            ) : (
              <>
                <Target size={12} /> Focus Session
              </>
            )}
          </span>
          <h3 className="text-xl font-semibold text-white">
            {session.subject || "General Study"}
          </h3>
        </div>

        {/* Timer Display */}
        <div
          className={clsx(
            "rounded-2xl p-6 text-center",
            session.type === "break"
              ? "bg-green-500/5 border border-green-500/20"
              : "bg-indigo-500/5 border border-indigo-500/20"
          )}
        >
          <div className="text-zinc-500 text-sm mb-2">
            {session.duration ? "Time Remaining" : "Time Elapsed"}
          </div>
          <div
            className={clsx(
              "text-5xl md:text-6xl font-mono font-bold tracking-wider",
              session.type === "break" ? "text-green-400" : "text-indigo-400"
            )}
          >
            {session.duration ? formatTime(remaining) : formatTime(elapsed)}
          </div>

          {/* Progress Bar */}
          {progress !== null && (
            <div className="mt-4 space-y-2">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-1000",
                    session.type === "break" ? "bg-green-500" : "bg-indigo-500"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{formatDuration(elapsed)} elapsed</span>
                <span>{Math.round(progress)}% complete</span>
                <span>
                  {session.duration ? formatDuration(session.duration) : "∞"}{" "}
                  target
                </span>
              </div>
            </div>
          )}

          {!session.duration && (
            <div className="mt-4 text-sm text-zinc-500">
              Stopwatch mode • No time limit
            </div>
          )}
        </div>

        {/* Goals Section */}
        {goals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Target size={14} />
                Session Goals
              </h4>
              <span
                className={clsx(
                  "text-sm font-medium",
                  completedGoals === goals.length
                    ? "text-green-400"
                    : "text-zinc-400"
                )}
              >
                {completedGoals}/{goals.length} completed
              </span>
            </div>
            <div className="space-y-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    goal.completed
                      ? "bg-green-500/5 border border-green-500/20"
                      : "bg-zinc-900/50 border border-white/5"
                  )}
                >
                  {goal.completed ? (
                    <CheckSquare
                      size={18}
                      className="text-green-500 shrink-0"
                    />
                  ) : (
                    <Square size={18} className="text-zinc-600 shrink-0" />
                  )}
                  <span
                    className={clsx(
                      "text-sm",
                      goal.completed
                        ? "text-zinc-500 line-through"
                        : "text-white"
                    )}
                  >
                    {goal.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {Math.floor(elapsed / 60)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Minutes In</div>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {session.type === "focus" ? "🎯" : "☕"}
            </div>
            <div className="text-xs text-zinc-500 mt-1 capitalize">
              {session.type}
            </div>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {goals.length > 0
                ? `${Math.round((completedGoals / goals.length) * 100)}%`
                : "—"}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Goals Done</div>
          </div>
        </div>

        {/* Encouragement */}
        <div className="text-center py-4 border-t border-white/5">
          <p className="text-zinc-400 text-sm">
            {session.type === "break"
              ? "Taking a well-deserved break! 🌟"
              : elapsed < 600
              ? "Just getting started! Keep it up! 💪"
              : elapsed < 1800
              ? "Great focus! Halfway through a Pomodoro! 🔥"
              : "Amazing dedication! True focus champion! 🏆"}
          </p>
        </div>
      </div>
    </div>
  );
}
