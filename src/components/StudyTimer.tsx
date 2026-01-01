"use client";

import { useState, useEffect, useRef } from "react";
import { databases, DB_ID, COLLECTIONS, client } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { ID, Permission, Role, Query } from "appwrite";
import {
  Play,
  Square,
  Lock,
  Globe,
  Plus,
  Calendar,
  Clock,
  Target,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Pause,
  Maximize2,
  Minimize2,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import GridTimerDisplay from "./GridTimerDisplay";

type SessionType = "focus" | "break";

interface ScheduledSession {
  $id: string;
  subject: string;
  goal: string;
  plannedDuration: number; // seconds
  scheduledAt: string;
  status: "scheduled" | "completed" | "skipped";
  type: SessionType;
}

export default function StudyTimer({
  onSessionComplete,
}: {
  onSessionComplete?: () => void;
}) {
  const { user } = useAuth();

  // Timer State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch");
  const [targetDuration, setTargetDuration] = useState(25 * 60); // Default 25m
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Session Details State
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("focus");

  // Planner State
  const [schedule, setSchedule] = useState<ScheduledSession[]>([]);
  const [showPlanner, setShowPlanner] = useState(false);
  const [newPlanTime, setNewPlanTime] = useState("");
  const [activePeers, setActivePeers] = useState(0);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  useEffect(() => {
    const fetchActivePeers = async () => {
      try {
        const result = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          [
            Query.equal("status", "active"),
            Query.limit(1), // We only need the total count
          ]
        );
        setActivePeers(result.total);
      } catch (error) {
        console.error("Failed to fetch active peers:", error);
      }
    };

    fetchActivePeers();

    const unsubscribe = client.subscribe(
      `databases.${DB_ID}.collections.${COLLECTIONS.STUDY_SESSIONS}.documents`,
      () => {
        // Refetch on any change to study sessions to keep count accurate
        fetchActivePeers();
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // --- Helpers ---

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const fetchSchedule = async () => {
    if (!user) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.STUDY_SESSIONS,
        [
          Query.equal("userId", user.$id),
          Query.equal("status", "scheduled"),
          Query.greaterThanEqual("scheduledAt", today.toISOString()),
          Query.orderAsc("scheduledAt"),
        ]
      );
      setSchedule(response.documents as any);
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
    }
  };

  // --- Timer Logic ---

  const startSession = async (scheduledSessionId?: string) => {
    if (!user) return;

    // Resume if paused
    if (isPaused && isActive) {
      setIsPaused(false);
      startTimeRef.current = Date.now() - elapsed * 1000;

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const diff = Math.floor((now - startTimeRef.current) / 1000);
          setElapsed(diff);
        }
      }, 1000);
      return;
    }

    // If starting from a scheduled session, pre-fill details
    if (scheduledSessionId) {
      const item = schedule.find((s) => s.$id === scheduledSessionId);
      if (item) {
        setSubject(item.subject);
        setGoal(item.goal);
        setTargetDuration(item.plannedDuration);
        setSessionType(item.type);
        // If it has a planned duration, switch to timer mode automatically
        if (item.plannedDuration > 0) {
          setMode("timer");
        }
      }
    }

    try {
      const startTime = new Date();
      const docData: any = {
        userId: user.$id,
        startTime: startTime.toISOString(),
        status: "active",
        isPublic: privacy === "public",
        duration: 0,
        subject: subject || "Untitled Session",
        goal: goal,
        type: sessionType,
      };

      let session;
      if (scheduledSessionId) {
        session = await databases.updateDocument(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          scheduledSessionId,
          docData
        );
      } else {
        session = await databases.createDocument(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          ID.unique(),
          docData,
          [
            Permission.read(
              privacy === "public" ? Role.any() : Role.user(user.$id)
            ),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ]
        );
      }

      setSessionId(session.$id);
      setIsActive(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();

      // Clear any existing interval just in case
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const diff = Math.floor((now - startTimeRef.current) / 1000);
          setElapsed(diff);
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const pauseSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPaused(true);
    // Optionally update DB status to 'paused' here if needed
  };

  const resetSession = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setIsPaused(false);
    setElapsed(0);

    // If we have a session ID, we should probably mark it as abandoned or delete it
    // For now, let's just clear the local state.
    // Ideally, we'd delete the document if it was just started and has no meaningful duration.
    if (sessionId) {
      try {
        // Optional: Delete the session if it was reset
        // await databases.deleteDocument(DB_ID, COLLECTIONS.STUDY_SESSIONS, sessionId);
      } catch (e) {
        console.error("Failed to delete reset session", e);
      }
    }
    setSessionId(null);
  };

  const stopSession = async () => {
    if (!sessionId || !user) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setIsPaused(false);
    startTimeRef.current = null;

    try {
      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.STUDY_SESSIONS,
        sessionId,
        {
          status: "completed",
          endTime: new Date().toISOString(),
          duration: elapsed,
        }
      );

      // Update Profile Stats
      try {
        const profiles = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PROFILES,
          [Query.equal("userId", user.$id)]
        );

        if (profiles.documents.length > 0) {
          const profile = profiles.documents[0];
          const newTotalHours = (profile.totalHours || 0) + elapsed / 3600;
          // XP Calculation: 1 XP per minute, bonus for completing target
          let xpGained = Math.floor(elapsed / 60);
          if (mode === "timer" && elapsed >= targetDuration) {
            xpGained += 50; // Bonus for hitting target
          }

          await databases.updateDocument(
            DB_ID,
            COLLECTIONS.PROFILES,
            profile.$id,
            {
              totalHours: newTotalHours,
              xp: (profile.xp || 0) + xpGained,
            }
          );

          if (onSessionComplete) {
            onSessionComplete();
          }
        }
      } catch (err) {
        console.error("Failed to update profile stats:", err);
      }
    } catch (error) {
      console.error("Failed to stop session:", error);
    }

    setElapsed(0);
    setSessionId(null);
    setSubject("");
    setGoal("");
    fetchSchedule(); // Refresh schedule to remove the completed one
  };

  const addToSchedule = async () => {
    if (!user || !subject || !newPlanTime) return;

    try {
      // Parse time string "HH:MM" to today's date
      const [hours, minutes] = newPlanTime.split(":").map(Number);
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);

      await databases.createDocument(
        DB_ID,
        COLLECTIONS.STUDY_SESSIONS,
        ID.unique(),
        {
          userId: user.$id,
          subject,
          goal,
          plannedDuration: mode === "timer" ? targetDuration : 0,
          scheduledAt: scheduledDate.toISOString(),
          status: "scheduled",
          type: sessionType,
          isPublic: false, // Plans are private by default until started
        },
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      setSubject("");
      setGoal("");
      setNewPlanTime("");
      fetchSchedule();
    } catch (error) {
      console.error("Failed to schedule session:", error);
    }
  };

  const deleteScheduledItem = async (id: string) => {
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.STUDY_SESSIONS, id);
      fetchSchedule();
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  // --- Effects ---

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  // Check for active session on mount (Recovery)
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!user) return;

      try {
        const sessions = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          [
            Query.equal("userId", user.$id),
            Query.equal("status", "active"),
            Query.orderDesc("startTime"),
            Query.limit(1),
          ]
        );

        if (sessions.documents.length > 0) {
          const session = sessions.documents[0];
          const startTime = new Date(session.startTime).getTime();
          const now = Date.now();
          const diffInSeconds = Math.floor((now - startTime) / 1000);

          setSessionId(session.$id);
          setPrivacy(session.isPublic ? "public" : "private");
          setSubject(session.subject || "");
          setGoal(session.goal || "");
          setSessionType(session.type || "focus");

          // If it had a planned duration, try to infer mode
          if (session.plannedDuration > 0) {
            setMode("timer");
            setTargetDuration(session.plannedDuration);
          }

          setElapsed(diffInSeconds);
          setIsActive(true);
          startTimeRef.current = startTime;

          // Start timer
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => {
            if (startTimeRef.current) {
              const currentNow = Date.now();
              setElapsed(
                Math.floor((currentNow - startTimeRef.current) / 1000)
              );
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Failed to check active session:", error);
      }
    };

    checkActiveSession();
  }, [user]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // --- Render ---

  const progress =
    mode === "timer" ? Math.min((elapsed / targetDuration) * 100, 100) : 0;
  const remaining =
    mode === "timer" ? Math.max(targetDuration - elapsed, 0) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Main Timer Panel */}
      <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 flex flex-col relative overflow-hidden min-h-[400px]">
        {/* Background Glow */}
        {isActive && (
          <div
            className={clsx(
              "absolute inset-0 animate-pulse pointer-events-none transition-colors duration-1000",
              sessionType === "break" ? "bg-green-500/5" : "bg-indigo-500/5"
            )}
          ></div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-8 z-10 flex-wrap gap-3">
          <div className="flex items-center gap-1 md:gap-2 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setSessionType("focus")}
              className={clsx(
                "px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-xs font-medium transition-all",
                sessionType === "focus"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              disabled={isActive}
            >
              Focus
            </button>
            <button
              onClick={() => setSessionType("break")}
              className={clsx(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                sessionType === "break"
                  ? "bg-green-600 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              disabled={isActive}
            >
              Break
            </button>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-zinc-900/50 rounded-lg border border-white/5 text-[10px] md:text-xs font-medium text-zinc-400 mr-1 md:mr-2">
              <Users size={12} className="text-green-500" />
              <span className="hidden md:inline">{activePeers} Studying</span>
              <span className="md:hidden">{activePeers}</span>
            </div>
            <button
              onClick={() => setIsFullScreen(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5"
              title="Full Screen Mode"
            >
              <Maximize2 size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
            <button
              onClick={() =>
                setPrivacy(privacy === "public" ? "private" : "public")
              }
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              title={
                privacy === "public" ? "Public Session" : "Private Session"
              }
              disabled={isActive}
            >
              {privacy === "public" ? <Globe size={18} /> : <Lock size={18} />}
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <div className="relative mb-8 flex flex-col items-center w-full">
            {/* Grid Timer Display */}
            <div className="mb-4 flex justify-center w-full">
              <GridTimerDisplay
                time={
                  mode === "timer" ? formatTime(remaining) : formatTime(elapsed)
                }
                size="md"
                isBreak={sessionType === "break"}
              />
            </div>

            {/* Progress Bar */}
            {mode === "timer" && (
              <div className="w-64 h-1.5 bg-zinc-800 rounded-full mt-6 overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    sessionType === "break" ? "bg-green-500" : "bg-indigo-500"
                  )}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Inputs (Only when not active) */}
          {!isActive && (
            <div className="w-full max-w-md space-y-3 md:space-y-4 mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Physics, Math"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="w-full sm:w-32 relative">
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Mode
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowModeDropdown(!showModeDropdown)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <span>{mode === "timer" ? "Timer" : "Stopwatch"}</span>
                    <motion.div
                      animate={{ rotate: showModeDropdown ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {showModeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setMode("stopwatch");
                            setShowModeDropdown(false);
                          }}
                          className={clsx(
                            "w-full px-3 py-2 text-sm text-left hover:bg-zinc-800 transition-colors",
                            mode === "stopwatch"
                              ? "text-indigo-400 bg-indigo-500/10"
                              : "text-white"
                          )}
                        >
                          Stopwatch
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode("timer");
                            setShowModeDropdown(false);
                          }}
                          className={clsx(
                            "w-full px-3 py-2 text-sm text-left hover:bg-zinc-800 transition-colors",
                            mode === "timer"
                              ? "text-indigo-400 bg-indigo-500/10"
                              : "text-white"
                          )}
                        >
                          Timer
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {mode === "timer" && (
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Duration (minutes)
                  </label>
                  <div className="flex gap-2">
                    {[25, 45, 60].map((m) => (
                      <button
                        key={m}
                        onClick={() => setTargetDuration(m * 60)}
                        className={clsx(
                          "px-3 py-1.5 rounded-md text-xs border transition-colors",
                          targetDuration === m * 60
                            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                    <input
                      type="number"
                      value={Math.floor(targetDuration / 60)}
                      onChange={(e) =>
                        setTargetDuration(parseInt(e.target.value) * 60)
                      }
                      className="w-20 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">
                  Goal (Optional)
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What do you want to achieve?"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          )}

          {/* Active Session Info */}
          {isActive && (
            <div className="text-center mb-8 animate-in fade-in zoom-in">
              <h3 className="text-xl text-white font-medium mb-1">
                {subject || "Untitled Session"}
              </h3>
              {goal && <p className="text-zinc-500 text-sm">{goal}</p>}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 md:gap-4 w-full max-w-xs">
            {!isActive ? (
              <button
                onClick={() => startSession()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white h-12 rounded-xl font-medium text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 hover:scale-105 active:scale-95"
              >
                <Play size={20} fill="currentColor" />
                {isPaused ? "Resume Session" : "Start Session"}
              </button>
            ) : (
              <>
                <button
                  onClick={isPaused ? () => startSession() : pauseSession}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white h-12 rounded-xl font-medium text-base flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  {isPaused ? (
                    <Play size={20} fill="currentColor" />
                  ) : (
                    <Pause size={20} fill="currentColor" />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={stopSession}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 h-12 rounded-xl font-medium text-base flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Square size={20} fill="currentColor" />
                  Stop
                </button>
              </>
            )}
          </div>

          {/* Reset Button (Only when paused) */}
          {isPaused && (
            <button
              onClick={resetSession}
              className="mt-4 text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} /> Reset Timer
            </button>
          )}
        </div>
      </div>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
          >
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
            >
              <Minimize2 size={32} />
            </button>

            {/* Grid Timer Display */}
            <div className="mb-12 scale-150">
              <GridTimerDisplay
                time={
                  mode === "timer" ? formatTime(remaining) : formatTime(elapsed)
                }
                size="lg"
                isBreak={sessionType === "break"}
              />
            </div>

            {mode === "timer" && (
              <div className="w-[600px] max-w-[90vw] h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    sessionType === "break" ? "bg-green-500" : "bg-indigo-500"
                  )}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            <div className="mt-12 flex items-center gap-6">
              <button
                onClick={isPaused ? () => startSession() : pauseSession}
                className="w-16 h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all hover:scale-110"
              >
                {isPaused ? (
                  <Play size={24} fill="currentColor" />
                ) : (
                  <Pause size={24} fill="currentColor" />
                )}
              </button>
              <button
                onClick={stopSession}
                className="w-16 h-16 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 flex items-center justify-center transition-all hover:scale-110"
              >
                <Square size={24} fill="currentColor" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Planner Panel */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col h-full min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" />
            Today's Plan
          </h3>
          <button
            onClick={() => setShowPlanner(!showPlanner)}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors"
          >
            {showPlanner ? <RotateCcw size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {/* Add New Item Form */}
        <AnimatePresence>
          {showPlanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6 border-b border-white/5 pb-6"
            >
              <div className="space-y-3">
                <input
                  type="time"
                  value={newPlanTime}
                  onChange={(e) => setNewPlanTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Goal (Optional)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addToSchedule}
                    className="flex-1 bg-indigo-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-indigo-500 transition-colors"
                  >
                    Add to Schedule
                  </button>
                  <button
                    onClick={() => setShowPlanner(false)}
                    className="px-3 bg-zinc-800 text-zinc-400 text-xs font-medium py-2 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {schedule.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 text-sm">
              <p>No sessions planned for today.</p>
              <button
                onClick={() => setShowPlanner(true)}
                className="text-indigo-400 hover:underline mt-2"
              >
                Plan your day
              </button>
            </div>
          ) : (
            schedule.map((item) => (
              <div
                key={item.$id}
                className="group bg-zinc-900/30 border border-white/5 rounded-xl p-4 hover:border-indigo-500/30 transition-colors relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">
                    <Clock size={12} />
                    {new Date(item.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <button
                    onClick={() => deleteScheduledItem(item.$id)}
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h4 className="text-white font-medium text-sm mb-1">
                  {item.subject}
                </h4>
                {item.goal && (
                  <div className="flex items-start gap-1.5 text-zinc-500 text-xs">
                    <Target size={12} className="mt-0.5 shrink-0" />
                    <p className="line-clamp-2">{item.goal}</p>
                  </div>
                )}

                {!isActive && (
                  <button
                    onClick={() => startSession(item.$id)}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-400 text-xs py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Play size={12} fill="currentColor" />
                    Start This Session
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
