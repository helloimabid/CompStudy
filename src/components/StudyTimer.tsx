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
  Clock,
  Target,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Pause,
  Maximize2,
  Minimize2,
  Users,
  Settings,
  Layout,
  CheckSquare,
  ListTodo,
  Shield,
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
  TimerFont,
} from "./TimerSettings";
import SessionDesigner, { SessionBlock, GoalItem } from "./SessionDesigner";

type SessionType = "focus" | "break";

interface ScheduledSession {
  $id: string;
  subject: string;
  goal: string;
  duration: number; // seconds
  scheduledAt: string;
  status: "scheduled" | "completed" | "skipped";
  type: SessionType;
}

interface Profile {
  profilePicture?: string;
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
  const [timerFont, setTimerFont] = useState<TimerFont>("default");
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [autoStartBreak, setAutoStartBreak] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [defaultFocusDuration, setDefaultFocusDuration] = useState(25 * 60); // 25 minutes
  const [defaultBreakDuration, setDefaultBreakDuration] = useState(5 * 60); // 5 minutes

  // Session Details State
  const [subject, setSubject] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [goal, setGoal] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("focus");
  const [sessionGoals, setSessionGoals] = useState<GoalItem[]>([]);
  const [showGoalsPanel, setShowGoalsPanel] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCurriculums();
      fetchSubjects();
      fetchTopics();
    }
  }, [user]);

  const fetchCurriculums = async () => {
    if (!user) return;
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

  const fetchSubjects = async () => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.SUBJECTS,
        [Query.equal("userId", user.$id)]
      );
      setSubjects(response.documents);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchTopics = async () => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.TOPICS,
        [Query.equal("userId", user.$id)]
      );
      setTopics(response.documents);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  // Planner State
  const [schedule, setSchedule] = useState<ScheduledSession[]>([]);
  const [showDesigner, setShowDesigner] = useState(false);
  const [activePeers, setActivePeers] = useState(0);
  const [peers, setPeers] = useState<any[]>([]);
  const [profilePicture, setProfilePicture] = useState<Profile | undefined>(
    undefined
  );
  const [profileStats, setProfileStats] = useState<{
    streak: number;
    xp: number;
    rank: number;
    totalHours: number;
    profilePicture?: string;
  }>({ streak: 0, xp: 0, rank: 0, totalHours: 0 });

  // Live session ID for real-time tracking
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);

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
        if (parsed.timerFont) setTimerFont(parsed.timerFont);
        if (parsed.autoStartFocus !== undefined)
          setAutoStartFocus(parsed.autoStartFocus);
        if (parsed.autoStartBreak !== undefined)
          setAutoStartBreak(parsed.autoStartBreak);
        if (parsed.strictMode !== undefined) setStrictMode(parsed.strictMode);
        if (parsed.defaultFocusDuration !== undefined)
          setDefaultFocusDuration(parsed.defaultFocusDuration);
        if (parsed.defaultBreakDuration !== undefined)
          setDefaultBreakDuration(parsed.defaultBreakDuration);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.targetDuration) setTargetDuration(parsed.targetDuration);
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
        timerFont,
        autoStartFocus,
        autoStartBreak,
        strictMode,
        defaultFocusDuration,
        defaultBreakDuration,
        mode,
        targetDuration,
      })
    );
  }, [
    themeColor,
    soundEnabled,
    visualMode,
    timerStyle,
    timerFont,
    autoStartFocus,
    autoStartBreak,
    strictMode,
    defaultFocusDuration,
    defaultBreakDuration,
    mode,
    targetDuration,
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

  // Fetch profile stats
  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!user) return;
      try {
        const profiles = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PROFILES,
          [Query.equal("userId", user.$id)]
        );

        if (profiles.documents.length > 0) {
          const profile = profiles.documents[0] as any;
          setProfileStats({
            streak: profile.streak || 0,
            xp: profile.xp || 0,
            rank: profile.rank || 0,
            totalHours: profile.totalHours || 0,
            // profilePicture: profile.profilePicture,
          });
          setProfilePicture(profile);
        }
      } catch (error) {
        console.error("Failed to fetch profile stats:", error);
      }
    };

    fetchProfileStats();
  }, [user]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isRestoringRef = useRef<boolean>(true); // Track if we're restoring from storage

  // Restore session state from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedSession = localStorage.getItem("activeStudySession");
      if (savedSession && user) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed.userId === user.$id && parsed.sessionId) {
            setSessionId(parsed.sessionId);
            setLiveSessionId(parsed.liveSessionId || null);
            setIsActive(parsed.isActive);
            setIsPaused(parsed.isPaused);
            setSubject(parsed.subject || "");
            setGoal(parsed.goal || "");
            setSessionType(parsed.sessionType || "focus");
            setMode(parsed.mode || "stopwatch");
            setTargetDuration(parsed.targetDuration || 25 * 60);
            setPrivacy(parsed.privacy || "public");

            // Restore elapsed time from saved value
            const savedElapsed = parsed.elapsed || 0;

            // If it was active AND not paused, continue timing from where we left off
            if (parsed.isActive && !parsed.isPaused) {
              // Calculate additional time that passed while page was closed
              const savedTimestamp = parsed.savedAt || Date.now();
              const additionalTime = Math.floor(
                (Date.now() - savedTimestamp) / 1000
              );
              const totalElapsed = savedElapsed + additionalTime;

              setElapsed(totalElapsed);
              startTimeRef.current = Date.now() - totalElapsed * 1000;

              // Try to update or recreate live session
              if (parsed.liveSessionId) {
                const updateSuccess = await updateLiveSession(
                  parsed.liveSessionId,
                  {
                    status: "active",
                    elapsedTime: totalElapsed,
                  }
                );

                // If update failed (document not found), create a new live session
                if (!updateSuccess && parsed.sessionId) {
                  console.log(
                    "Live session not found on reload, creating new one..."
                  );
                  const newLiveSessionId = await createLiveSession({
                    subject: parsed.subject || "Focus Session",
                    goal: parsed.goal || "",
                    startTime: new Date(
                      Date.now() - totalElapsed * 1000
                    ).toISOString(),
                    duration:
                      parsed.mode === "timer"
                        ? parsed.targetDuration
                        : undefined,
                    sessionType: parsed.sessionType || "focus",
                  });
                  if (newLiveSessionId) {
                    setLiveSessionId(newLiveSessionId);
                    console.log(
                      "New live session created on reload:"
                      // newLiveSessionId
                    );
                  }
                }
              } else if (parsed.sessionId) {
                // No liveSessionId in localStorage, create one
                console.log(
                  "No live session ID found, creating new live session..."
                );
                const newLiveSessionId = await createLiveSession({
                  subject: parsed.subject || "Focus Session",
                  goal: parsed.goal || "",
                  startTime: new Date(
                    Date.now() - totalElapsed * 1000
                  ).toISOString(),
                  duration:
                    parsed.mode === "timer" ? parsed.targetDuration : undefined,
                  sessionType: parsed.sessionType || "focus",
                });
                if (newLiveSessionId) {
                  setLiveSessionId(newLiveSessionId);
                  console.log(
                    "New live session created on reload:"
                    // newLiveSessionId
                  );
                }
              }

              // Update study session in database with current elapsed time
              if (parsed.sessionId) {
                databases
                  .updateDocument(
                    DB_ID,
                    COLLECTIONS.STUDY_SESSIONS,
                    parsed.sessionId,
                    {
                      duration: totalElapsed,
                      status: "active",
                    }
                  )
                  .catch((err) =>
                    console.error(
                      "Failed to update study session on mount:",
                      err
                    )
                  );
              }

              intervalRef.current = setInterval(() => {
                if (startTimeRef.current) {
                  const now = Date.now();
                  const diff = Math.floor((now - startTimeRef.current) / 1000);
                  setElapsed(diff);
                }
              }, 1000);
            } else if (parsed.isActive && parsed.isPaused) {
              // If paused, just restore the elapsed time without starting the timer
              setElapsed(savedElapsed);
              startTimeRef.current = Date.now() - savedElapsed * 1000;

              // Try to update or recreate live session for paused state
              if (parsed.liveSessionId) {
                const updateSuccess = await updateLiveSession(
                  parsed.liveSessionId,
                  {
                    status: "paused",
                    elapsedTime: savedElapsed,
                  }
                );

                // If update failed (document not found), create a new live session in paused state
                if (!updateSuccess && parsed.sessionId) {
                  console.log(
                    "Paused live session not found on reload, creating new one..."
                  );
                  const newLiveSessionId = await createLiveSession({
                    subject: parsed.subject || "Focus Session",
                    goal: parsed.goal || "",
                    startTime: new Date(
                      Date.now() - savedElapsed * 1000
                    ).toISOString(),
                    duration:
                      parsed.mode === "timer"
                        ? parsed.targetDuration
                        : undefined,
                    sessionType: parsed.sessionType || "focus",
                  });
                  if (newLiveSessionId) {
                    setLiveSessionId(newLiveSessionId);
                    // Update it to paused status immediately
                    await updateLiveSession(newLiveSessionId, {
                      status: "paused",
                      elapsedTime: savedElapsed,
                    });
                    console.log(
                      "New paused live session created on reload:"
                      // newLiveSessionId
                    );
                  }
                }
              } else if (parsed.sessionId) {
                // No liveSessionId in localStorage, create one
                console.log(
                  "No live session ID found for paused session, creating new one..."
                );
                const newLiveSessionId = await createLiveSession({
                  subject: parsed.subject || "Focus Session",
                  goal: parsed.goal || "",
                  startTime: new Date(
                    Date.now() - savedElapsed * 1000
                  ).toISOString(),
                  duration:
                    parsed.mode === "timer" ? parsed.targetDuration : undefined,
                  sessionType: parsed.sessionType || "focus",
                });
                if (newLiveSessionId) {
                  setLiveSessionId(newLiveSessionId);
                  // Update it to paused status immediately
                  await updateLiveSession(newLiveSessionId, {
                    status: "paused",
                    elapsedTime: savedElapsed,
                  });
                  console.log(
                    "New paused live session created on reload:"
                    // newLiveSessionId
                  );
                }
              }

              // Update study session in database
              if (parsed.sessionId) {
                databases
                  .updateDocument(
                    DB_ID,
                    COLLECTIONS.STUDY_SESSIONS,
                    parsed.sessionId,
                    {
                      duration: savedElapsed,
                      status: "active",
                    }
                  )
                  .catch((err) =>
                    console.error(
                      "Failed to update paused session on mount:",
                      err
                    )
                  );
              }
            } else {
              // Not active, just restore elapsed
              setElapsed(savedElapsed);
            }
          }
        } catch (error) {
          console.error("Failed to restore session:", error);
          localStorage.removeItem("activeStudySession");
        }
      }

      // Mark restoration as complete after a short delay
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 500);
    };

    restoreSession();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  // Handle page visibility changes - update database when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive && sessionId && startTimeRef.current) {
        // Calculate current elapsed time
        const now = Date.now();
        const currentElapsed = Math.floor((now - startTimeRef.current) / 1000);

        // Update both databases immediately when tab becomes visible
        if (liveSessionId) {
          updateLiveSession(liveSessionId, {
            status: isPaused ? "paused" : "active",
            elapsedTime: currentElapsed,
          });
        }

        databases
          .updateDocument(DB_ID, COLLECTIONS.STUDY_SESSIONS, sessionId, {
            duration: currentElapsed,
            status: "active",
          })
          .catch((err) =>
            console.error("Failed to update session on visibility change:", err)
          );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, isPaused, sessionId, liveSessionId]);

  // Save session state to localStorage whenever it changes
  useEffect(() => {
    if (sessionId && user) {
      localStorage.setItem(
        "activeStudySession",
        JSON.stringify({
          userId: user.$id,
          sessionId,
          liveSessionId,
          isActive,
          isPaused,
          elapsed,
          subject,
          goal,
          sessionType,
          mode,
          targetDuration,
          privacy,
          savedAt: Date.now(), // Timestamp when this was saved
        })
      );
    } else {
      localStorage.removeItem("activeStudySession");
    }
  }, [
    sessionId,
    liveSessionId,
    isActive,
    isPaused,
    elapsed,
    user,
    subject,
    goal,
    sessionType,
    mode,
    targetDuration,
    privacy,
  ]);

  // --- Helper Functions for Live Session Tracking ---

  const createLiveSession = async (sessionData: {
    subject: string;
    goal: string;
    startTime: string;
    duration?: number;
    sessionType: SessionType;
  }) => {
    if (!user) {
      console.error("Cannot create live session: user is not defined");
      return null;
    }

    try {
      // console.log("Creating live session with data:", {
      //   userId: user.$id,
      //   subject: sessionData.subject,
      //   sessionType: sessionData.sessionType,
      //   isPublic: privacy === "public",
      // });

      const liveSession = await databases.createDocument(
        DB_ID,
        COLLECTIONS.LIVE_SESSIONS,
        ID.unique(),
        {
          userId: user.$id,
          username: user.name || "Anonymous",
          subject: sessionData.subject || "General Study",
          goal: sessionData.goal || "",
          startTime: sessionData.startTime,
          lastUpdateTime: new Date().toISOString(),
          status: "active",
          sessionType: sessionData.sessionType,
          duration: sessionData.duration || null,
          elapsedTime: 0,
          isPublic: privacy === "public",
          profilePicture: profilePicture?.profilePicture || null,
          streak: profileStats.streak || 0,
          totalHours: profileStats.totalHours || 0,
        },
        [
          Permission.read(
            privacy === "public" ? Role.any() : Role.user(user.$id)
          ),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );
      // console.log("Live session created successfully:", liveSession.$id);
      return liveSession.$id;
    } catch (error: any) {
      console.error("Failed to create live session:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        type: error.type,
      });
      return null;
    }
  };

  const updateLiveSession = async (
    liveId: string,
    updates: {
      status?: "active" | "paused" | "completed";
      elapsedTime?: number;
    }
  ) => {
    if (!liveId) {
      console.warn("Cannot update live session: liveId is null or empty");
      return false;
    }

    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.LIVE_SESSIONS, liveId, {
        ...updates,
        lastUpdateTime: new Date().toISOString(),
      });
      return true;
    } catch (error: any) {
      console.error("Failed to update live session:", error);

      // If document not found (404), try to recreate it
      if (error.code === 404 || error.message?.includes("not be found")) {
        // console.log("Live session not found, attempting to recreate...");

        // Clear the old invalid ID
        setLiveSessionId(null);

        // Try to recreate the live session if we have session data
        if (sessionId && user && subject) {
          const newLiveSessionId = await createLiveSession({
            subject: subject || "Focus Session",
            goal: goal || "",
            startTime: new Date(
              Date.now() - (updates.elapsedTime || 0) * 1000
            ).toISOString(),
            duration: mode === "timer" ? targetDuration : undefined,
            sessionType: sessionType,
          });

          if (newLiveSessionId) {
            // console.log("Live session recreated:", newLiveSessionId);
            setLiveSessionId(newLiveSessionId);
            return true;
          }
        }
      }
      return false;
    }
  };

  const deleteLiveSession = async (liveId: string) => {
    if (!liveId) return;

    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.LIVE_SESSIONS, liveId);
    } catch (error) {
      console.error("Failed to delete live session:", error);
    }
  };

  // --- Helpers ---

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Get the next scheduled session (if any)
  const getNextScheduledSession = () => {
    if (schedule.length === 0) return null;

    // If we're currently running a scheduled session, find the next one after it
    if (sessionId && isActive) {
      const currentIndex = schedule.findIndex((s) => s.$id === sessionId);
      if (currentIndex !== -1 && currentIndex < schedule.length - 1) {
        // Return the next session in the schedule
        return schedule[currentIndex + 1];
      }
    }

    // Otherwise, find the next session that hasn't started yet (based on time)
    const now = new Date();
    const nextSession = schedule.find((s) => {
      const sessionTime = new Date(s.scheduledAt);
      return sessionTime > now;
    });
    return nextSession || null;
  };

  const nextScheduledSession = getNextScheduledSession();

  // Toggle goal completion
  const toggleGoalCompletion = (goalId: string) => {
    setSessionGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, completed: !g.completed } : g))
    );
  };

  // Helper to format duration for display
  const formatDurationDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} ${secs === 1 ? "second" : "seconds"}`;
    if (secs === 0) return `${mins} ${mins === 1 ? "minute" : "minutes"}`;
    return `${mins}m ${secs}s`;
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

      // Update live session status
      if (liveSessionId) {
        updateLiveSession(liveSessionId, {
          status: "active",
          elapsedTime: elapsed,
        });
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const diff = Math.floor((now - startTimeRef.current) / 1000);
          setElapsed(diff);

          // Update live session every 30 seconds
          if (diff % 30 === 0 && liveSessionId) {
            updateLiveSession(liveSessionId, {
              elapsedTime: diff,
              status: "active",
            });
          }
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
        setTargetDuration(item.duration);
        setSessionType(item.type);
        // Parse goals from JSON if available
        if (item.goal) {
          try {
            const parsedGoals = JSON.parse(item.goal);
            if (Array.isArray(parsedGoals)) {
              setSessionGoals(parsedGoals);
            }
          } catch {
            // Not JSON, clear goals
            setSessionGoals([]);
          }
        } else {
          setSessionGoals([]);
        }
        // If it has a duration, switch to timer mode automatically
        if (item.duration > 0) {
          setMode("timer");
        }
      }
    } else {
      // Clear goals for non-scheduled sessions
      setSessionGoals([]);
    }

    try {
      const startTime = new Date();
      const sessionTypeToUse = overrides?.type || sessionType;
      const subjectToUse =
        overrides?.subject ||
        subject ||
        (sessionTypeToUse === "break" ? "Break Time" : "Focus Session");
      const docData: any = {
        userId: user.$id,
        startTime: startTime.toISOString(),
        status: "active",
        isPublic: privacy === "public",
        duration: mode === "timer" ? targetDuration : 0,
        subject: subjectToUse,
        curriculumId: curriculumId || null,
        goal:
          sessionGoals.length > 0 ? JSON.stringify(sessionGoals) : goal || "",
        type: sessionTypeToUse,
        timerMode: mode,
        plannedDuration: mode === "timer" ? targetDuration : 0,
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

      // Create live session in Appwrite
      const newLiveSessionId = await createLiveSession({
        subject: subjectToUse,
        goal: sessionGoals.length > 0 ? JSON.stringify(sessionGoals) : goal,
        startTime: session.startTime,
        duration: mode === "timer" ? targetDuration : undefined,
        sessionType: sessionTypeToUse,
      });

      if (!newLiveSessionId) {
        console.error(
          "Failed to create live session - session will continue but won't be visible to others"
        );
        // Show a warning to the user that their session won't be public
        if (privacy === "public") {
          alert(
            "Warning: Your session is running locally but may not be visible to others. Check your internet connection."
          );
        }
      }

      setLiveSessionId(newLiveSessionId);

      // Clear any existing interval just in case
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const diff = Math.floor((now - startTimeRef.current) / 1000);
          setElapsed(diff);

          // Update both live_sessions and study_sessions every 30 seconds
          if (diff % 30 === 0) {
            // Update live session if it exists
            if (newLiveSessionId) {
              updateLiveSession(newLiveSessionId, {
                elapsedTime: diff,
                status: "active",
              });
            }

            // Also update study_sessions
            if (session?.$id) {
              databases
                .updateDocument(
                  DB_ID,
                  COLLECTIONS.STUDY_SESSIONS,
                  session.$id,
                  {
                    duration: diff,
                  }
                )
                .catch((err) =>
                  console.error("Failed to update study session:", err)
                );
            }
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const pauseSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPaused(true);

    // Update live session status
    if (liveSessionId) {
      updateLiveSession(liveSessionId, {
        status: "paused",
        elapsedTime: elapsed,
      });
    }
  };

  const resumeSession = () => {
    if (!isPaused) return;
    setIsPaused(false);
    startTimeRef.current = Date.now() - elapsed * 1000;

    // Update live session status
    if (liveSessionId) {
      updateLiveSession(liveSessionId, {
        status: "active",
        elapsedTime: elapsed,
      });
    }

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        const diff = Math.floor((now - startTimeRef.current) / 1000);
        setElapsed(diff);

        // Update live session every 30 seconds
        if (diff % 30 === 0 && liveSessionId) {
          updateLiveSession(liveSessionId, {
            elapsedTime: diff,
            status: "active",
          });
        }
      }
    }, 1000);
  };

  const resetSession = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setIsPaused(false);

    // Delete live session
    if (liveSessionId) {
      await deleteLiveSession(liveSessionId);
    }

    setElapsed(0);

    // Clear localStorage
    localStorage.removeItem("activeStudySession");

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
    setLiveSessionId(null);
  };

  const stopSession = async () => {
    if (!sessionId || !user) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setIsPaused(false);
    startTimeRef.current = null;

    // Clear localStorage
    localStorage.removeItem("activeStudySession");

    // Delete live session
    if (liveSessionId) {
      await deleteLiveSession(liveSessionId);
      setLiveSessionId(null);
    }

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

          // Streak calculation
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const lastStudyDate = profile.lastStudyDate
            ? new Date(profile.lastStudyDate)
            : null;
          let newStreak = profile.streak || 0;

          if (lastStudyDate) {
            lastStudyDate.setHours(0, 0, 0, 0);
            const daysSinceLastStudy = Math.floor(
              (today.getTime() - lastStudyDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (daysSinceLastStudy === 0) {
              // Already studied today, keep streak
            } else if (daysSinceLastStudy === 1) {
              // Studied yesterday, increment streak
              newStreak += 1;
            } else {
              // Missed days, reset streak to 1
              newStreak = 1;
            }
          } else {
            // First time studying
            newStreak = 1;
          }

          await databases.updateDocument(
            DB_ID,
            COLLECTIONS.PROFILES,
            profile.$id,
            {
              totalHours: newTotalHours,
              xp: (profile.xp || 0) + xpGained,
              streak: newStreak,
              lastStudyDate: new Date().toISOString(),
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

  const handleSaveDesigner = async (
    blocks: SessionBlock[],
    startTimeStr: string
  ) => {
    if (!user) {
      console.error("No user logged in");
      return;
    }

    if (blocks.length === 0) {
      console.error("No blocks to save");
      return;
    }

    try {
      const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
      let currentTime = new Date();
      currentTime.setHours(startHours, startMinutes, 0, 0);

      // If start time is in the past today, it will still save for today
      // User can see it in their schedule

      for (const block of blocks) {
        // Serialize goals to JSON if they exist
        const goalsJson =
          block.goals && block.goals.length > 0
            ? JSON.stringify(block.goals.filter((g) => g.text.trim() !== ""))
            : "";

        const docData = {
          userId: user.$id,
          subject:
            block.subject ||
            (block.type === "break" ? "Break" : "Focus Session"),
          goal: goalsJson,
          duration: block.duration * 60,
          scheduledAt: currentTime.toISOString(),
          startTime: currentTime.toISOString(),
          status: "scheduled",
          type: block.type,
          isPublic: false,
        };

        // console.log("Saving block:", docData);

        await databases.createDocument(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          ID.unique(),
          docData,
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ]
        );

        // Advance time for the next block
        currentTime = new Date(currentTime.getTime() + block.duration * 60000);
      }

      // console.log("All blocks saved successfully");
      setShowDesigner(false);
      await fetchSchedule();
    } catch (error: any) {
      console.error("Failed to save designed session:", error);
      console.error("Error message:", error?.message);
      console.error("Error response:", error?.response);
      alert(`Failed to save schedule: ${error?.message || "Unknown error"}`);
    }
  };

  const handleStartNowDesigner = (blocks: SessionBlock[]) => {
    if (!user || blocks.length === 0) return;

    const firstBlock = blocks[0];

    // Set up the session with first block's details
    setSubject(
      firstBlock.subject ||
        (firstBlock.type === "break" ? "Break" : "Focus Session")
    );
    setGoal(firstBlock.goal || "");
    setSessionType(firstBlock.type);
    setTargetDuration(firstBlock.duration * 60);
    setMode("timer");

    // Close the designer
    setShowDesigner(false);

    // Start the session immediately
    setTimeout(() => {
      startSession(undefined, {
        type: firstBlock.type,
        duration: firstBlock.duration * 60,
        subject:
          firstBlock.subject ||
          (firstBlock.type === "break" ? "Break" : "Focus Session"),
      });
    }, 100);
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

    // Check if there's a next scheduled session
    const nextSession = getNextScheduledSession();

    if (nextSession) {
      // Only auto-start if there's a scheduled session
      setTimeout(() => startSession(nextSession.$id), 500);
    }
    // Removed auto-start for focus/break sessions
    // Users should manually start new sessions unless they have a schedule
  };

  // --- Effects ---

  useEffect(() => {
    // Don't auto-complete during initial restoration from localStorage
    if (isRestoringRef.current) return;

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
        // console.log("Full screen request denied", e);
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
          if (session.duration > 0) {
            setMode("timer");
            setTargetDuration(session.duration);
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

              {/* Goals Panel - Fullscreen */}
              {sessionGoals.length > 0 && isActive && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:block">
                  <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 w-64">
                    <div className="flex items-center gap-2 mb-3 text-zinc-400">
                      <ListTodo size={16} />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        Session Goals
                      </span>
                    </div>
                    <div className="space-y-2">
                      {sessionGoals.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => toggleGoalCompletion(goal.id)}
                          className={clsx(
                            "flex items-center gap-2 w-full text-left transition-all group",
                            goal.completed ? "opacity-60" : "opacity-100"
                          )}
                        >
                          {goal.completed ? (
                            <CheckSquare
                              size={16}
                              className="text-green-500 shrink-0"
                            />
                          ) : (
                            <Square
                              size={16}
                              className="text-indigo-400/60 group-hover:text-indigo-400 shrink-0"
                            />
                          )}
                          <span
                            className={clsx(
                              "text-sm transition-all",
                              goal.completed
                                ? "text-zinc-500 line-through"
                                : "text-zinc-300 group-hover:text-white"
                            )}
                          >
                            {goal.text}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 text-xs text-zinc-500">
                      {sessionGoals.filter((g) => g.completed).length}/
                      {sessionGoals.length} completed
                    </div>
                  </div>
                </div>
              )}

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
                  <div className="scale-90 sm:scale-110 md:scale-125">
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
                  <div className="scale-110 sm:scale-125 md:scale-150">
                    <DigitalTimerDisplay
                      time={
                        mode === "timer"
                          ? formatTime(remaining)
                          : formatTime(elapsed)
                      }
                      size="lg"
                      isBreak={sessionType === "break"}
                      themeColor={themeColor}
                      timerFont={timerFont}
                    />
                  </div>
                )}
                {timerStyle === "circular" && (
                  <div className="scale-90 sm:scale-110 md:scale-125">
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
                      timerFont={timerFont}
                    />
                  </div>
                )}
                {timerStyle === "minimal" && (
                  <div className="scale-125 sm:scale-150 md:scale-[2]">
                    <MinimalTimerDisplay
                      time={
                        mode === "timer"
                          ? formatTime(remaining)
                          : formatTime(elapsed)
                      }
                      size="lg"
                      isBreak={sessionType === "break"}
                      themeColor={themeColor}
                      timerFont={timerFont}
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
              {isActive && nextScheduledSession && (
                <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 text-center z-10 px-4">
                  <p className="text-zinc-500 text-xs sm:text-sm">
                    Next:{" "}
                    {nextScheduledSession.subject ||
                      (nextScheduledSession.type === "break"
                        ? "Break"
                        : "Focus")}{" "}
                    ({formatDurationDisplay(nextScheduledSession.duration)})
                  </p>
                </div>
              )}
              {isActive &&
                !nextScheduledSession &&
                autoStartBreak &&
                sessionType === "focus" && (
                  <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 text-center z-10 px-4">
                    <p className="text-zinc-500 text-xs sm:text-sm">
                      Next: Break ({formatDurationDisplay(defaultBreakDuration)}
                      )
                    </p>
                  </div>
                )}
              {isActive &&
                !nextScheduledSession &&
                autoStartFocus &&
                sessionType === "break" && (
                  <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 text-center z-10 px-4">
                    <p className="text-zinc-500 text-xs sm:text-sm">
                      Next: Focus Session (
                      {formatDurationDisplay(defaultFocusDuration)})
                    </p>
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Normal Mode */}
      <div className="flex flex-col gap-3 h-[calc(100vh-100px)] max-h-[calc(100vh-100px)] overflow-hidden">
        {/* Main Timer Panel */}
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div
            className={clsx(
              "flex-1 bg-[#0a0a0a] border rounded-2xl p-4 sm:p-5 flex flex-col relative overflow-hidden transition-all duration-500 min-h-0",
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
            <div className="flex items-start justify-between mb-3 sm:mb-4 z-10 gap-4">
              <div>
                {isActive ? (
                  <>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                      {subject || "Focus Session"}
                    </h1>
                    <p className="text-zinc-500 text-xs sm:text-sm flex items-center gap-2">
                      {sessionType === "focus" ? "🎯 Focus" : "☕ Break"} •{" "}
                      {mode === "timer" ? "Timer" : "Stopwatch"}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {curriculums.length > 0 ? (
                        <select
                          value={curriculumId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setCurriculumId(id);
                            if (id) {
                              const selected = curriculums.find(
                                (c) => c.$id === id
                              );
                              if (selected) setSubject(selected.name);
                            }
                          }}
                          className="bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500/50"
                        >
                          <option value="">From My Curriculum...</option>
                          {curriculums.map((c) => (
                            <option key={c.$id} value={c.$id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <a
                          href="/curriculum"
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Add subjects to curriculum
                        </a>
                      )}
                    </div>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What are you working on?"
                      className="bg-transparent text-lg sm:text-xl md:text-2xl font-bold text-white placeholder:text-zinc-700 focus:outline-none w-full"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                  title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullScreen ? (
                    <Minimize2 size={16} className="sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize2 size={16} className="sm:w-5 sm:h-5" />
                  )}
                </button>

                <button
                  onClick={() => setShowDesigner(true)}
                  className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                  title="Session Designer"
                >
                  <Layout size={16} className="sm:w-5 sm:h-5" />
                </button>

                <button
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                  title="Settings"
                >
                  <Settings size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Control Bar - Mode & Session Type Toggles */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4 z-10">
              {/* Timer/Stopwatch Toggle */}
              <div className="flex items-center bg-zinc-900/80 rounded-lg p-0.5 border border-white/5">
                <button
                  onClick={() => setMode("timer")}
                  disabled={isActive}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                    mode === "timer"
                      ? clsx(currentTheme.bg, "text-white shadow-sm")
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Clock size={12} />
                  Timer
                </button>
                <button
                  onClick={() => setMode("stopwatch")}
                  disabled={isActive}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                    mode === "stopwatch"
                      ? clsx(currentTheme.bg, "text-white shadow-sm")
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <RotateCcw size={12} />
                  Stopwatch
                </button>
              </div>

              {/* Focus/Break Toggle */}
              <div className="flex items-center bg-zinc-900/80 rounded-lg p-0.5 border border-white/5">
                <button
                  onClick={() => {
                    setSessionType("focus");
                    if (mode === "timer")
                      setTargetDuration(defaultFocusDuration);
                  }}
                  disabled={isActive}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                    sessionType === "focus"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Target size={12} />
                  Focus
                </button>
                <button
                  onClick={() => {
                    setSessionType("break");
                    if (mode === "timer")
                      setTargetDuration(defaultBreakDuration);
                  }}
                  disabled={isActive}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                    sessionType === "break"
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  ☕ Break
                </button>
              </div>

              {/* Timer Duration (only show in timer mode) */}
              {mode === "timer" && !isActive && (
                <div className="flex items-center gap-1.5 bg-zinc-900/80 rounded-lg px-2 py-1 border border-white/5">
                  <button
                    onClick={() =>
                      setTargetDuration(Math.max(60, targetDuration - 5 * 60))
                    }
                    className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xs font-medium text-white min-w-[3rem] text-center">
                    {Math.floor(targetDuration / 60)}m
                  </span>
                  <button
                    onClick={() => setTargetDuration(targetDuration + 5 * 60)}
                    className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Strict Mode Toggle */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900/80 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 border border-white/5">
                <button
                  onClick={() => setStrictMode(!strictMode)}
                  className={clsx(
                    "w-7 sm:w-8 h-3.5 sm:h-4 rounded-full transition-colors relative",
                    strictMode ? "bg-indigo-600" : "bg-zinc-700"
                  )}
                  disabled={isActive}
                  title="Strict Mode - Pauses when you leave the tab"
                >
                  <div
                    className={clsx(
                      "absolute top-0.5 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-white transition-all",
                      strictMode ? "left-3.5 sm:left-4" : "left-0.5"
                    )}
                  ></div>
                </button>
                <span className="text-[10px] sm:text-xs font-medium text-zinc-400 flex items-center gap-0.5">
                  <Shield size={12} className="sm:hidden" />
                  <span className="hidden sm:inline">Strict</span>
                </span>
              </div>

              {/* Public/Private Toggle */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900/80 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 border border-white/5">
                <button
                  onClick={() =>
                    setPrivacy(privacy === "public" ? "private" : "public")
                  }
                  className={clsx(
                    "w-7 sm:w-8 h-3.5 sm:h-4 rounded-full transition-colors relative",
                    privacy === "public" ? "bg-green-600" : "bg-zinc-700"
                  )}
                  disabled={isActive}
                  title={
                    privacy === "public"
                      ? "Session is visible to others"
                      : "Session is private"
                  }
                >
                  <div
                    className={clsx(
                      "absolute top-0.5 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-white transition-all",
                      privacy === "public" ? "left-3.5 sm:left-4" : "left-0.5"
                    )}
                  ></div>
                </button>
                <span className="text-[10px] sm:text-xs font-medium text-zinc-400 flex items-center gap-0.5">
                  {privacy === "public" ? (
                    <>
                      <Globe size={10} />
                      <span className="hidden sm:inline">Live</span>
                    </>
                  ) : (
                    <>
                      <Lock size={10} />
                      <span className="hidden sm:inline">Private</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {mode === "timer" && (
              <div className="w-full h-1 bg-zinc-800/50 rounded-full mb-4 sm:mb-5 md:mb-6 overflow-hidden relative z-10">
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
            <div className="flex-1 flex flex-col items-center justify-center z-10 relative min-h-0">
              {timerStyle === "grid" && (
                <div className="scale-[0.65] sm:scale-75">
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
                <div className="scale-75 sm:scale-90">
                  <DigitalTimerDisplay
                    time={
                      mode === "timer"
                        ? formatTime(remaining)
                        : formatTime(elapsed)
                    }
                    size="lg"
                    isBreak={sessionType === "break"}
                    themeColor={themeColor}
                    timerFont={timerFont}
                  />
                </div>
              )}
              {timerStyle === "circular" && (
                <div className="scale-[0.65] sm:scale-75">
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
                    timerFont={timerFont}
                  />
                </div>
              )}
              {timerStyle === "minimal" && (
                <div className="scale-75 sm:scale-90">
                  <MinimalTimerDisplay
                    time={
                      mode === "timer"
                        ? formatTime(remaining)
                        : formatTime(elapsed)
                    }
                    size="lg"
                    isBreak={sessionType === "break"}
                    themeColor={themeColor}
                    timerFont={timerFont}
                  />
                </div>
              )}
              <p className="text-zinc-500 font-medium tracking-[0.2em] text-xs sm:text-sm mt-4 sm:mt-6 uppercase">
                {sessionType === "break" ? "Break Time" : "Session Time"}
              </p>

              {/* Controls */}
              <div className="mt-4 sm:mt-6 flex items-center gap-4 sm:gap-6">
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

              {/* Goals Checklist - Normal Mode */}
              {sessionGoals.length > 0 && isActive && (
                <div className="mt-4 sm:mt-6 w-full max-w-sm">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <ListTodo size={14} />
                        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                          Goals
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs text-zinc-500">
                        {sessionGoals.filter((g) => g.completed).length}/
                        {sessionGoals.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {sessionGoals.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => toggleGoalCompletion(goal.id)}
                          className={clsx(
                            "flex items-center gap-2 w-full text-left transition-all group py-0.5",
                            goal.completed ? "opacity-60" : "opacity-100"
                          )}
                        >
                          {goal.completed ? (
                            <CheckSquare
                              size={14}
                              className="text-green-500 shrink-0"
                            />
                          ) : (
                            <Square
                              size={14}
                              className="text-indigo-400/60 group-hover:text-indigo-400 shrink-0"
                            />
                          )}
                          <span
                            className={clsx(
                              "text-xs sm:text-sm transition-all",
                              goal.completed
                                ? "text-zinc-500 line-through"
                                : "text-zinc-300 group-hover:text-white"
                            )}
                          >
                            {goal.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col justify-center">
              <p className="text-zinc-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1">
                Current Streak
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                {profileStats.streak}{" "}
                <span className="text-orange-500">🔥</span>
              </p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col justify-center">
              <p className="text-zinc-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1">
                Total XP
              </p>
              <p
                className={clsx(
                  "text-xl sm:text-2xl font-bold",
                  currentTheme.text
                )}
              >
                {profileStats.xp.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col justify-center">
              <p className="text-zinc-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1">
                Total Hours
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white">
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
          timerFont={timerFont}
          setTimerFont={setTimerFont}
          autoStartFocus={autoStartFocus}
          setAutoStartFocus={setAutoStartFocus}
          autoStartBreak={autoStartBreak}
          setAutoStartBreak={setAutoStartBreak}
          targetDuration={targetDuration}
          setTargetDuration={(duration) => {
            setTargetDuration(duration);
            setMode("timer");
          }}
          applyPreset={(focus) => {
            setMode("timer");
            setTargetDuration(focus * 60);
          }}
        />

        <SessionDesigner
          isOpen={showDesigner}
          onClose={() => setShowDesigner(false)}
          onSave={handleSaveDesigner}
          onStartNow={handleStartNowDesigner}
          existingSchedule={schedule}
          curriculums={curriculums}
          subjects={subjects}
          topics={topics}
          onDeleteScheduledItem={async (id: string) => {
            try {
              await databases.deleteDocument(
                DB_ID,
                COLLECTIONS.STUDY_SESSIONS,
                id
              );
              fetchSchedule();
            } catch (error) {
              console.error("Failed to delete scheduled item:", error);
            }
          }}
          onStartScheduledSession={(id: string) => {
            setShowDesigner(false);
            startSession(id);
          }}
        />
      </div>
    </>
  );
}
