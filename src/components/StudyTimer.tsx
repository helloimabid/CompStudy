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
  Settings,
  Layout,
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import GridTimerDisplay from "./GridTimerDisplay";
import {
  DigitalTimerDisplay,
  CircularTimerDisplay,
  MinimalTimerDisplay,
} from "./TimerDisplays";
import TimerSettings, {
  ThemeColor,
  VisualMode,
  TimerStyle,
} from "./TimerSettings";
import SessionDesigner, { SessionBlock } from "./SessionDesigner";

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

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>("indigo");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visualMode, setVisualMode] = useState<VisualMode>("grid");
  const [timerStyle, setTimerStyle] = useState<TimerStyle>("grid");
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [autoStartBreak, setAutoStartBreak] = useState(false);
  const [strictMode, setStrictMode] = useState(false);

  // Session Details State
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("focus");

  // Planner State
  const [schedule, setSchedule] = useState<ScheduledSession[]>([]);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [newPlanTime, setNewPlanTime] = useState("");
  const [activePeers, setActivePeers] = useState(0);
  const [peers, setPeers] = useState<any[]>([]);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [profileStats, setProfileStats] = useState<{
    streak: number;
    xp: number;
    rank: number;
    totalHours: number;
  }>({ streak: 0, xp: 0, rank: 0, totalHours: 0 });

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("studyTimerSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.themeColor) setThemeColor(parsed.themeColor);
        if (parsed.soundEnabled !== undefined)
          setSoundEnabled(parsed.soundEnabled);
        if (parsed.visualMode) setVisualMode(parsed.visualMode);
        if (parsed.timerStyle) setTimerStyle(parsed.timerStyle);
        if (parsed.autoStartFocus !== undefined)
          setAutoStartFocus(parsed.autoStartFocus);
        if (parsed.autoStartBreak !== undefined)
          setAutoStartBreak(parsed.autoStartBreak);
        if (parsed.strictMode !== undefined) setStrictMode(parsed.strictMode);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      "studyTimerSettings",
      JSON.stringify({
        themeColor,
        soundEnabled,
        visualMode,
        timerStyle,
        autoStartFocus,
        autoStartBreak,
        strictMode,
      })
    );
  }, [
    themeColor,
    soundEnabled,
    visualMode,
    timerStyle,
    autoStartFocus,
    autoStartBreak,
    strictMode,
  ]);

  useEffect(() => {
    const fetchActivePeers = async () => {
      try {
        const result = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          [
            Query.equal("status", "active"),
            Query.orderDesc("startTime"),
            Query.limit(5),
          ]
        );
        setPeers(result.documents);
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

  const fetchProfileStats = async () => {
    if (!user) return;
    try {
      const profiles = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.equal("userId", user.$id)]
      );

      if (profiles.documents.length > 0) {
        const profile = profiles.documents[0];
        setProfileStats({
          streak: profile.streak || 0,
          xp: profile.xp || 0,
          rank: profile.rank || 0,
          totalHours: profile.totalHours || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile stats:", error);
    }
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

  const startSession = async (
    scheduledSessionId?: string,
    overrides?: { type?: SessionType; duration?: number; subject?: string }
  ) => {
    if (!user) return;

    // Resume if paused
    if (isPaused && isActive && !overrides) {
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

    // Apply overrides if provided
    if (overrides) {
      if (overrides.type) setSessionType(overrides.type);
      if (overrides.duration) {
        setTargetDuration(overrides.duration);
        setMode("timer");
      }
      if (overrides.subject) setSubject(overrides.subject);
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
        subject: overrides?.subject || subject || "Untitled Session",
        goal: goal,
        type: overrides?.type || sessionType,
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
    fetchSchedule();
    fetchProfileStats();
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
          startTime: scheduledDate.toISOString(),
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

  const handleSaveDesigner = async (
    blocks: SessionBlock[],
    startTimeStr: string
  ) => {
    if (!user) return;

    try {
      const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
      let currentTime = new Date();
      currentTime.setHours(startHours, startMinutes, 0, 0);

      // If start time is in the past, assume tomorrow? Or just today (past).
      // Let's assume today.

      for (const block of blocks) {
        await databases.createDocument(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          ID.unique(),
          {
            userId: user.$id,
            subject:
              block.subject ||
              (block.type === "break" ? "Break" : "Focus Session"),
            goal: block.goal || "",
            plannedDuration: block.duration * 60,
            scheduledAt: currentTime.toISOString(),
            startTime: currentTime.toISOString(),
            status: "scheduled",
            type: block.type,
            isPublic: false,
          },
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ]
        );

        // Advance time
        currentTime = new Date(currentTime.getTime() + block.duration * 60000);
      }

      setShowDesigner(false);
      fetchSchedule();
    } catch (error) {
      console.error("Failed to save designed session:", error);
    }
  };

  const handleTimerComplete = async () => {
    if (soundEnabled) {
      // Simple beep or custom sound
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
      );
      audio.play().catch((e) => console.error("Audio play failed", e));
    }

    await stopSession();

    if (sessionType === "focus" && autoStartBreak) {
      setTimeout(
        () =>
          startSession(undefined, {
            type: "break",
            duration: 5 * 60,
            subject: "Break Time",
          }),
        500
      );
    } else if (sessionType === "break" && autoStartFocus) {
      setTimeout(
        () =>
          startSession(undefined, {
            type: "focus",
            duration: 25 * 60,
            subject: "Focus Session",
          }),
        500
      );
    }
  };

  // --- Effects ---

  useEffect(() => {
    if (isActive && mode === "timer" && elapsed >= targetDuration) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      handleTimerComplete();
    }
  }, [isActive, mode, elapsed, targetDuration]);

  // Strict Mode Logic
  useEffect(() => {
    if (!strictMode || !isActive || isPaused) return;

    // Request Full Screen on Strict Mode activation
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.log("Full screen request denied", e);
      });
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseSession();
        // You could add a toast notification here
        const audio = new Audio(
          "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        );
        audio.play().catch(() => {});
        alert("Strict Mode: Distraction Detected! Session Paused.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [strictMode, isActive, isPaused]);

  useEffect(() => {
    fetchSchedule();
    fetchProfileStats();
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

  const themeClasses = {
    indigo: {
      bg: "bg-indigo-600",
      text: "text-indigo-400",
      border: "border-indigo-500/30",
      ring: "ring-indigo-500/20",
      glow: "bg-indigo-500/5",
      hover: "hover:bg-indigo-500",
    },
    cyan: {
      bg: "bg-cyan-600",
      text: "text-cyan-400",
      border: "border-cyan-500/30",
      ring: "ring-cyan-500/20",
      glow: "bg-cyan-500/5",
      hover: "hover:bg-cyan-500",
    },
    green: {
      bg: "bg-green-600",
      text: "text-green-400",
      border: "border-green-500/30",
      ring: "ring-green-500/20",
      glow: "bg-green-500/5",
      hover: "hover:bg-green-500",
    },
    amber: {
      bg: "bg-amber-600",
      text: "text-amber-400",
      border: "border-amber-500/30",
      ring: "ring-amber-500/20",
      glow: "bg-amber-500/5",
      hover: "hover:bg-amber-500",
    },
    rose: {
      bg: "bg-rose-600",
      text: "text-rose-400",
      border: "border-rose-500/30",
      ring: "ring-rose-500/20",
      glow: "bg-rose-500/5",
      hover: "hover:bg-rose-500",
    },
    violet: {
      bg: "bg-violet-600",
      text: "text-violet-400",
      border: "border-violet-500/30",
      ring: "ring-violet-500/20",
      glow: "bg-violet-500/5",
      hover: "hover:bg-violet-500",
    },
  };

  const currentTheme = themeClasses[themeColor];

  return (
    <>
      {/* Fullscreen Mode Overlay */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center"
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-8 relative">
              {/* Background Effects */}
              {visualMode !== "minimal" && (
                <>
                  <div
                    className={clsx(
                      "absolute inset-0 animate-pulse pointer-events-none transition-colors duration-1000",
                      currentTheme.glow
                    )}
                  ></div>
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_80%)] pointer-events-none"></div>
                  {visualMode === "cyber" && (
                    <div
                      className={clsx(
                        "absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[20%] w-full animate-[scan_4s_linear_infinite] pointer-events-none"
                      )}
                    ></div>
                  )}
                </>
              )}

              {/* Exit Button */}
              <button
                onClick={() => setIsFullScreen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 p-2 sm:p-3 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors z-10"
              >
                <Minimize2 size={20} className="sm:w-6 sm:h-6" />
              </button>

              {/* Session Info */}
              <div className="text-center mb-6 md:mb-8 z-10 px-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">
                  {subject || "Focus Session"}
                </h1>
                <p className="text-zinc-500 text-sm sm:text-base md:text-lg">
                  {sessionType === "break" ? "Break Time" : "Session Time"}
                </p>
              </div>

              {/* Progress Bar */}
              {mode === "timer" && (
                <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl h-1.5 md:h-2 bg-zinc-800/50 rounded-full mb-8 md:mb-12 overflow-hidden z-10 px-4">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_20px_currentColor]",
                      sessionType === "break"
                        ? "bg-green-500 text-green-500"
                        : clsx(currentTheme.bg, currentTheme.text)
                    )}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}

              {/* Timer Display */}
              <div className="z-10 mb-8 md:mb-12">
                {timerStyle === "grid" && (
                  <div className="scale-100 sm:scale-125 md:scale-150">
                    <GridTimerDisplay
                      time={
                        mode === "timer"
                          ? formatTime(remaining)
                          : formatTime(elapsed)
                      }
                      themeColor={themeColor}
                      isBreak={sessionType === "break"}
                    />
                  </div>
                )}
                {timerStyle === "digital" && (
                  <div className="scale-125 sm:scale-150 md:scale-[2]">
                    <DigitalTimerDisplay
                      time={
                        mode === "timer"
                          ? formatTime(remaining)
                          : formatTime(elapsed)
                      }
                      size="lg"
                      isBreak={sessionType === "break"}
                      themeColor={themeColor}
                    />
                  </div>
                )}
                {timerStyle === "circular" && (
                  <div className="scale-100 sm:scale-125 md:scale-150">
                    <CircularTimerDisplay
                      time={
                        mode === "timer"
                          ? formatTime(remaining)
                          : formatTime(elapsed)
                      }
                      progress={progress}
                      size="lg"
                      isBreak={sessionType === "break"}
                      themeColor={themeColor}
                    />
                  </div>
                )}
                {timerStyle === "minimal" && (
                  <div className="scale-150 sm:scale-[2] md:scale-[2.5]">
                    <MinimalTimerDisplay
                      time={
                        mode === "timer"
                          ? formatTime(remaining)
                          : formatTime(elapsed)
                      }
                      size="lg"
                      isBreak={sessionType === "break"}
                      themeColor={themeColor}
                    />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-8 z-10">
                {!isActive ? (
                  <button
                    onClick={() => startSession()}
                    className={clsx(
                      "px-12 py-6 rounded-full font-bold text-xl flex items-center gap-3 transition-all shadow-2xl hover:scale-105 active:scale-95",
                      currentTheme.bg,
                      "text-white"
                    )}
                  >
                    <Play size={28} fill="currentColor" />
                    Start Focus
                  </button>
                ) : (
                  <>
                    <button
                      onClick={isPaused ? () => startSession() : pauseSession}
                      className="w-20 h-20 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all hover:scale-110 shadow-xl"
                    >
                      {isPaused ? (
                        <Play size={32} fill="currentColor" />
                      ) : (
                        <Pause size={32} fill="currentColor" />
                      )}
                    </button>
                    <button
                      onClick={stopSession}
                      className="w-20 h-20 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border-2 border-red-500/20 flex items-center justify-center transition-all hover:scale-110 shadow-xl"
                    >
                      <Square size={32} fill="currentColor" />
                    </button>
                  </>
                )}
              </div>

              {/* Next Session Info */}
              {isActive && autoStartBreak && sessionType === "focus" && (
                <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 text-center z-10 px-4">
                  <p className="text-zinc-500 text-xs sm:text-sm">
                    Next: Break (5 minutes)
                  </p>
                </div>
              )}
              {isActive && autoStartFocus && sessionType === "break" && (
                <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 text-center z-10 px-4">
                  <p className="text-zinc-500 text-xs sm:text-sm">
                    Next: Focus Session (25 minutes)
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Normal Mode */}
      <div className="flex flex-col gap-4 md:gap-6 h-[calc(100vh-140px)] min-h-[500px] md:min-h-[600px]">
        {/* Main Timer Panel */}
        <div className="flex flex-col gap-4 md:gap-6">
          <div
            className={clsx(
              "flex-1 bg-[#0a0a0a] border rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col relative overflow-hidden transition-all duration-500",
              isActive ? currentTheme.border : "border-white/5"
            )}
          >
            {/* Background Glow & Grid */}
            {isActive && visualMode !== "minimal" && (
              <>
                <div
                  className={clsx(
                    "absolute inset-0 animate-pulse pointer-events-none transition-colors duration-1000",
                    currentTheme.glow
                  )}
                ></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] pointer-events-none"></div>
                {/* Scanner Line */}
                {visualMode === "cyber" && (
                  <>
                    <div
                      className={clsx(
                        "absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[20%] w-full animate-[scan_4s_linear_infinite] pointer-events-none"
                      )}
                    ></div>
                    <div className="absolute inset-0 crt-overlay z-0 pointer-events-none opacity-30"></div>
                  </>
                )}
              </>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-6 sm:mb-8 md:mb-12 z-10 gap-4">
              <div>
                {isActive ? (
                  <>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                      {subject || "Focus Session"}
                    </h1>
                    <p className="text-zinc-500 text-xs sm:text-sm flex items-center gap-2">
                      Global Room #882 • High Intensity
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What are you working on?"
                      className="bg-transparent text-lg sm:text-xl md:text-2xl font-bold text-white placeholder:text-zinc-700 focus:outline-none w-full"
                    />
                    <div className="flex items-center gap-2 relative">
                      <button
                        onClick={() => setShowModeDropdown(!showModeDropdown)}
                        className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors flex items-center gap-1"
                      >
                        {mode === "timer" ? "Timer Mode" : "Stopwatch Mode"}
                        <MoreHorizontal size={14} />
                      </button>
                      {showModeDropdown && (
                        <div className="absolute top-8 left-0 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                          <button
                            onClick={() => {
                              setMode("timer");
                              setShowModeDropdown(false);
                            }}
                            className={clsx(
                              "px-4 py-2 text-sm text-left w-full hover:bg-white/5 transition-colors",
                              mode === "timer"
                                ? "text-white bg-white/5"
                                : "text-zinc-400"
                            )}
                          >
                            Timer Mode
                          </button>
                          <button
                            onClick={() => {
                              setMode("stopwatch");
                              setShowModeDropdown(false);
                            }}
                            className={clsx(
                              "px-4 py-2 text-sm text-left w-full hover:bg-white/5 transition-colors",
                              mode === "stopwatch"
                                ? "text-white bg-white/5"
                                : "text-zinc-400"
                            )}
                          >
                            Stopwatch Mode
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="hidden sm:flex items-center gap-2 md:gap-3 bg-zinc-900/50 p-1.5 pr-3 md:pr-4 rounded-full border border-white/5">
                  <button
                    onClick={() => setStrictMode(!strictMode)}
                    className={clsx(
                      "w-10 h-6 rounded-full transition-colors relative",
                      strictMode ? "bg-indigo-600" : "bg-zinc-700"
                    )}
                    disabled={isActive}
                  >
                    <div
                      className={clsx(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        strictMode ? "left-5" : "left-1"
                      )}
                    ></div>
                  </button>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Strict Mode
                  </span>
                </div>

                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                  title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullScreen ? (
                    <Minimize2 size={18} className="sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize2 size={18} className="sm:w-5 sm:h-5" />
                  )}
                </button>

                <button
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                >
                  <Settings size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {mode === "timer" && (
              <div className="w-full h-1 bg-zinc-800/50 rounded-full mb-6 sm:mb-8 md:mb-12 overflow-hidden relative z-10">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_currentColor]",
                    sessionType === "break"
                      ? "bg-green-500 text-green-500"
                      : clsx(currentTheme.bg, currentTheme.text)
                  )}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            {/* Timer Display */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
              {timerStyle === "grid" && (
                <GridTimerDisplay
                  time={
                    mode === "timer"
                      ? formatTime(remaining)
                      : formatTime(elapsed)
                  }
                  themeColor={themeColor}
                  isBreak={sessionType === "break"}
                />
              )}
              {timerStyle === "digital" && (
                <div className="scale-125 md:scale-150">
                  <DigitalTimerDisplay
                    time={
                      mode === "timer"
                        ? formatTime(remaining)
                        : formatTime(elapsed)
                    }
                    size="lg"
                    isBreak={sessionType === "break"}
                    themeColor={themeColor}
                  />
                </div>
              )}
              {timerStyle === "circular" && (
                <CircularTimerDisplay
                  time={
                    mode === "timer"
                      ? formatTime(remaining)
                      : formatTime(elapsed)
                  }
                  progress={progress}
                  size="lg"
                  isBreak={sessionType === "break"}
                  themeColor={themeColor}
                />
              )}
              {timerStyle === "minimal" && (
                <div className="scale-150">
                  <MinimalTimerDisplay
                    time={
                      mode === "timer"
                        ? formatTime(remaining)
                        : formatTime(elapsed)
                    }
                    size="lg"
                    isBreak={sessionType === "break"}
                    themeColor={themeColor}
                  />
                </div>
              )}
              <p className="text-zinc-500 font-medium tracking-[0.2em] text-sm mt-8 uppercase">
                {sessionType === "break" ? "Break Time" : "Session Time"}
              </p>

              {/* Controls */}
              <div className="mt-6 sm:mt-8 md:mt-12 flex items-center gap-4 sm:gap-6">
                {!isActive ? (
                  <button
                    onClick={() => startSession()}
                    className={clsx(
                      "px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-medium text-sm sm:text-base flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95",
                      currentTheme.bg,
                      "text-white",
                      `shadow-${themeColor}-500/20`
                    )}
                  >
                    <Play
                      size={18}
                      fill="currentColor"
                      className="sm:w-5 sm:h-5"
                    />
                    Start Focus
                  </button>
                ) : (
                  <>
                    <button
                      onClick={isPaused ? () => startSession() : pauseSession}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all hover:scale-110"
                    >
                      {isPaused ? (
                        <Play
                          size={20}
                          fill="currentColor"
                          className="sm:w-6 sm:h-6"
                        />
                      ) : (
                        <Pause
                          size={20}
                          fill="currentColor"
                          className="sm:w-6 sm:h-6"
                        />
                      )}
                    </button>
                    <button
                      onClick={stopSession}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 flex items-center justify-center transition-all hover:scale-110"
                    >
                      <Square
                        size={20}
                        fill="currentColor"
                        className="sm:w-6 sm:h-6"
                      />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col justify-center min-h-[100px] sm:min-h-[120px]">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1 sm:mb-2">
                Current Streak
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                {profileStats.streak}{" "}
                <span className="text-orange-500">🔥</span>
              </p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col justify-center min-h-[100px] sm:min-h-[120px]">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1 sm:mb-2">
                Total XP
              </p>
              <p
                className={clsx(
                  "text-2xl sm:text-3xl font-bold",
                  currentTheme.text
                )}
              >
                {profileStats.xp.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col justify-center min-h-[100px] sm:min-h-[120px]">
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1 sm:mb-2">
                Total Hours
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {profileStats.totalHours.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        {/* Modals */}
        <TimerSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          visualMode={visualMode}
          setVisualMode={setVisualMode}
          timerStyle={timerStyle}
          setTimerStyle={setTimerStyle}
          autoStartFocus={autoStartFocus}
          setAutoStartFocus={setAutoStartFocus}
          autoStartBreak={autoStartBreak}
          setAutoStartBreak={setAutoStartBreak}
          applyPreset={(focus, breakTime) => {
            setMode("timer");
            setTargetDuration(focus * 60);
          }}
        />

        <SessionDesigner
          isOpen={showDesigner}
          onClose={() => setShowDesigner(false)}
          onSave={handleSaveDesigner}
        />

        {/* Planner Modal (Reused existing logic but in modal) */}
        <AnimatePresence>
          {showPlanner && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPlanner(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
              >
                <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">
                      Today's Plan
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDesigner(true)}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors"
                        title="Design Session Sequence"
                      >
                        <Layout size={16} />
                      </button>
                      <button
                        onClick={() => setShowPlanner(false)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <Minimize2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Add New Item Form */}
                    <div className="space-y-3 mb-6">
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
                      <button
                        onClick={addToSchedule}
                        className={clsx(
                          "w-full text-white text-xs font-medium py-2 rounded-lg transition-colors",
                          currentTheme.bg,
                          currentTheme.hover
                        )}
                      >
                        Add to Schedule
                      </button>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                      {schedule.map((item) => (
                        <div
                          key={item.$id}
                          className="group bg-zinc-900/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors relative"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div
                              className={clsx(
                                "flex items-center gap-2 text-xs font-medium px-2 py-1 rounded bg-white/5",
                                currentTheme.text
                              )}
                            >
                              <Clock size={12} />
                              {new Date(item.scheduledAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
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
                          {!isActive && (
                            <button
                              onClick={() => {
                                startSession(item.$id);
                                setShowPlanner(false);
                              }}
                              className={clsx(
                                "mt-3 w-full flex items-center justify-center gap-2 bg-zinc-800 hover:text-white text-zinc-400 text-xs py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                                currentTheme.hover
                              )}
                            >
                              <Play size={12} fill="currentColor" />
                              Start
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
