"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Clock,
  Play,
  Pause,
  RotateCcw,
  LogOut,
  Copy,
  Check,
  Loader2,
  Wifi,
  WifiOff,
  Settings,
  Maximize2,
  Minimize2,
  Lock,
  MessageCircle,
  Send,
  X,
  ChevronDown,
  BellOff,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  Coffee,
  PlayCircle,
  StopCircle,
  ChevronUp,
  Pencil,
  Save,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { client, databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { ID, Permission, Query, Role } from "appwrite";
import GridTimerDisplay from "@/components/GridTimerDisplay";
import {
  DigitalTimerDisplay,
  CircularTimerDisplay,
  MinimalTimerDisplay,
} from "@/components/TimerDisplays";
import TimerSettings, {
  ThemeColor,
  VisualMode,
  TimerStyle,
  TimerFont,
} from "@/components/TimerSettings";
import {
  CloudflareWebSocketProvider,
  useCloudflareWebSocket,
} from "@/context/CloudflareWebSocketContext";

export const runtime = "edge";
interface RoomParticipant {
  $id: string;
  roomId: string;
  userId: string;
  username: string;
  joinedAt: string;
}

interface Room {
  $id: string;
  name: string;
  subject: string;
  activeUsers: number;
  isStrict: boolean;
  roomId: string;
  creatorId: string;
  participants: string;
  timerState: "idle" | "running" | "paused";
  timeRemaining: number;
  mode: "pomodoro" | "short-break" | "long-break";
  visibility?: "public" | "private";
  schedule?: string; // JSON stringified schedule data
  $createdAt: string;
  $updatedAt: string;
}

interface ScheduleItem {
  id: string;
  curriculumId: string;
  curriculumName: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  duration: number; // in minutes
  order: number;
  completed: boolean;
  isBreak?: boolean; // true for break items
}

interface Curriculum {
  $id: string;
  name: string;
  description?: string;
  subjects?: string;
}

interface CurriculumSubject {
  name: string;
  description?: string;
  color?: string;
  topics?: string[];
}

type PresenceUser = {
  userId: string;
  username: string;
  profilePicture?: string;
};

const DEFAULT_DURATIONS: Record<Room["mode"], number> = {
  pomodoro: 25 * 60,
  "short-break": 5 * 60,
  "long-break": 15 * 60,
};

function parseRoomConfig(room: Room): {
  durations?: Partial<Record<Room["mode"], number>>;
  bans?: Record<string, { type: "temporary" | "permanent"; untilMs?: number }>;
} {
  try {
    const parsed = JSON.parse(room.participants);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return parsed;
  } catch {
    return {};
  }
}

function getActiveBan(
  room: Room | null,
  userId: string
): { type: "temporary" | "permanent"; untilMs?: number } | null {
  if (!room || !userId) return null;
  const config = parseRoomConfig(room);
  const entry = config.bans?.[userId];
  if (!entry) return null;
  if (entry.type === "permanent") return entry;
  if (entry.type === "temporary") {
    if (typeof entry.untilMs === "number" && Date.now() < entry.untilMs)
      return entry;
  }
  return null;
}

function getRoomDurations(room: Room | null): Record<Room["mode"], number> {
  if (!room) return DEFAULT_DURATIONS;
  const config = parseRoomConfig(room);
  const durations = config.durations ?? {};
  return {
    pomodoro:
      typeof durations.pomodoro === "number"
        ? durations.pomodoro
        : DEFAULT_DURATIONS.pomodoro,
    "short-break":
      typeof durations["short-break"] === "number"
        ? durations["short-break"]
        : DEFAULT_DURATIONS["short-break"],
    "long-break":
      typeof durations["long-break"] === "number"
        ? durations["long-break"]
        : DEFAULT_DURATIONS["long-break"],
  };
}

function dedupeUsers(users: PresenceUser[]): PresenceUser[] {
  const map = new Map<string, PresenceUser>();
  for (const u of users) {
    if (!u?.userId) continue;
    map.set(u.userId, u);
  }
  return Array.from(map.values());
}

function estimateServerOffsetMs(room: Room): number {
  const updatedAtMs = new Date(room.$updatedAt || room.$createdAt).getTime();
  // Treat updatedAt as "server now" at receipt-time.
  return Date.now() - updatedAtMs;
}

function computeDerivedRemaining(room: Room, serverOffsetMs = 0): number {
  if (room.timerState !== "running") return room.timeRemaining;
  const updatedAtMs = new Date(room.$updatedAt || room.$createdAt).getTime();
  const serverNowMs = Date.now() - serverOffsetMs;
  const elapsedSec = Math.max(
    0,
    Math.floor((serverNowMs - updatedAtMs) / 1000)
  );
  return Math.max(0, room.timeRemaining - elapsedSec);
}

function RoomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const roomId = params.roomId as string;
  const { isConnected, connectionStatus, sendMessage, messages } =
    useCloudflareWebSocket();

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [participantProfiles, setParticipantProfiles] = useState<
    Map<string, { username: string; profilePicture?: string }>
  >(new Map());
  const [roomLoading, setRoomLoading] = useState(true);
  const [profile, setProfile] = useState<{
    username: string;
    profilePicture?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(0);
  const lastMessageIndexRef = useRef(0);
  const serverOffsetMsRef = useRef(0);
  const roomDurations = getRoomDurations(room);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>("indigo");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visualMode, setVisualMode] = useState<VisualMode>("grid");
  const [timerStyle, setTimerStyle] = useState<TimerStyle>("grid");
  const [timerFont, setTimerFont] = useState<TimerFont>("default");
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [autoStartBreak, setAutoStartBreak] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(true);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      userId: string;
      username: string;
      message: string;
      timestamp: string;
    }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatMuted, setChatMuted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [configDraft, setConfigDraft] = useState<{
    name: string;
    subject: string;
    isStrict: boolean;
    pomodoroMin: number;
    shortBreakMin: number;
    longBreakMin: number;
  } | null>(null);
  const [configSaving, setConfigSaving] = useState(false);

  // Schedule State
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [availableCurricula, setAvailableCurricula] = useState<Curriculum[]>(
    []
  );
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>("");
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [selectedTopicName, setSelectedTopicName] = useState<string>("");
  const [parsedSubjects, setParsedSubjects] = useState<CurriculumSubject[]>([]);
  const [scheduleDuration, setScheduleDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [scheduleVisible, setScheduleVisible] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [scheduleRunning, setScheduleRunning] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<{
    curriculumId: string;
    subjectName: string;
    topicName: string;
    duration: number;
  } | null>(null);

  // // Timer Settings State
  // const [showSettings, setShowSettings] = useState(false);
  // const [themeColor, setThemeColor] = useState<ThemeColor>("indigo");
  // const [soundEnabled, setSoundEnabled] = useState(true);
  // const [visualMode, setVisualMode] = useState<VisualMode>("grid");
  // const [timerStyle, setTimerStyle] = useState<TimerStyle>("grid");
  // const [timerFont, setTimerFont] = useState<TimerFont>("default");
  // const [autoStartFocus, setAutoStartFocus] = useState(false);
  // const [autoStartBreak, setAutoStartBreak] = useState(false);
  // const [isFullScreen, setIsFullScreen] = useState(false);

  const requestedRoomConfigRef = useRef<{
    name?: string;
    subject?: string;
    curriculumId?: string;
    isStrict?: boolean;
    visibility?: "public" | "private";
    durations?: Record<Room["mode"], number>;
  } | null>(null);

  if (requestedRoomConfigRef.current === null) {
    const clampMin = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));
    const toMinutes = (key: string, fallback: number) => {
      const raw = searchParams.get(key);
      const parsed = raw ? Number.parseInt(raw, 10) : NaN;
      if (!Number.isFinite(parsed)) return fallback;
      return clampMin(parsed, 1, 600);
    };

    const pMin = toMinutes("p", 25);
    const sMin = toMinutes("s", 5);
    const lMin = toMinutes("l", 15);
    const strict = searchParams.get("strict");

    const name = searchParams.get("name") || undefined;
    const subject = searchParams.get("subject") || undefined;
    const curriculumId = searchParams.get("curriculumId") || undefined;
    const visibility =
      (searchParams.get("visibility") as "public" | "private") || "public";

    requestedRoomConfigRef.current = {
      name,
      subject,
      curriculumId,
      isStrict: strict === "1" ? true : strict === "0" ? false : undefined,
      visibility,
      durations: {
        pomodoro: pMin * 60,
        "short-break": sMin * 60,
        "long-break": lMin * 60,
      },
    };
  }

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("roomTimerSettings");
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
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      "roomTimerSettings",
      JSON.stringify({
        themeColor,
        soundEnabled,
        visualMode,
        timerStyle,
        timerFont,
        autoStartFocus,
        autoStartBreak,
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
  ]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch user profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const profiles = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PROFILES,
          [Query.equal("userId", user.$id), Query.limit(1)]
        );
        if (profiles.documents.length > 0) {
          const profileData = profiles.documents[0] as any;
          setProfile({
            username: profileData.username,
            profilePicture: profileData.profilePicture,
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch profiles for all participants
  useEffect(() => {
    const fetchParticipantProfiles = async () => {
      const userIds = participants.map((p) => p.userId);
      if (userIds.length === 0) return;

      try {
        const profiles = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PROFILES,
          [Query.equal("userId", userIds)]
        );

        const profileMap = new Map<
          string,
          { username: string; profilePicture?: string }
        >();
        profiles.documents.forEach((p: any) => {
          profileMap.set(p.userId, {
            username: p.username,
            profilePicture: p.profilePicture,
          });
        });
        setParticipantProfiles(profileMap);
      } catch (error) {
        console.error("Failed to fetch participant profiles:", error);
      }
    };

    fetchParticipantProfiles();
  }, [participants]);

  // Fetch or create room
  useEffect(() => {
    if (!user || !profile) return;

    const initRoom = async () => {
      try {
        // Try to find existing room by roomId
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.ROOMS,
          [Query.equal("roomId", roomId), Query.limit(1)]
        );

        let currentRoom: Room;

        if (response.documents.length > 0) {
          // Room exists
          currentRoom = response.documents[0] as unknown as Room;
          serverOffsetMsRef.current = estimateServerOffsetMs(currentRoom);
          setRoom(currentRoom);
          // Use the current timer state from the room, don't reset
          setLocalTimeRemaining(currentRoom.timeRemaining);

          // If user is banned, don't allow them to join.
          const activeBan = getActiveBan(currentRoom, user.$id);
          if (activeBan) {
            const untilLabel =
              activeBan.type === "temporary" &&
              typeof activeBan.untilMs === "number"
                ? ` (until ${new Date(activeBan.untilMs).toLocaleString()})`
                : "";
            alert(`You are banned from this room${untilLabel}.`);
            router.push("/start-studying");
            return;
          }

          // Private rooms - user just needs the room code (URL) to join
          // No separate join code verification needed since room ID IS the code

          // Check if user is already a participant
          const participantCheck = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.ROOM_PARTICIPANTS,
            [
              Query.equal("roomId", roomId),
              Query.equal("userId", user.$id),
              Query.limit(1),
            ]
          );

          // If duplicates exist (can happen if cleanup failed), delete extras.
          if (participantCheck.documents.length > 1) {
            const docs = participantCheck.documents as any[];
            for (const extra of docs.slice(1)) {
              await databases.deleteDocument(
                DB_ID,
                COLLECTIONS.ROOM_PARTICIPANTS,
                extra.$id
              );
            }
          }

          if (participantCheck.documents.length === 0) {
            // First, remove user from any other rooms they might be in
            const userOtherRooms = await databases.listDocuments(
              DB_ID,
              COLLECTIONS.ROOM_PARTICIPANTS,
              [Query.equal("userId", user.$id)]
            );

            // Delete all other participant entries for this user
            for (const doc of userOtherRooms.documents) {
              if (doc.roomId !== roomId) {
                await databases.deleteDocument(
                  DB_ID,
                  COLLECTIONS.ROOM_PARTICIPANTS,
                  doc.$id
                );
              }
            }

            // Add current user as participant
            // Note: Users can only grant permissions to themselves, not other users
            // The kicked user deletes their own record via WebSocket admin-action handler
            await databases.createDocument(
              DB_ID,
              COLLECTIONS.ROOM_PARTICIPANTS,
              ID.unique(),
              {
                roomId: roomId,
                userId: user.$id,
                username: profile.username,
                joinedAt: new Date().toISOString(),
              },
              [
                Permission.read(Role.any()),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
              ]
            );
          }
        } else {
          // Room doesn't exist, create it
          const requested = requestedRoomConfigRef.current;
          const requestedDurations = requested?.durations ?? DEFAULT_DURATIONS;
          const requestedName =
            (requested?.name && requested.name.trim()) ||
            `Study Room ${roomId}`;
          const requestedSubject =
            (requested?.subject && requested.subject.trim()) || "General";
          const requestedCurriculumId = requested?.curriculumId || null;
          const requestedIsStrict = requested?.isStrict ?? false;
          const requestedVisibility = requested?.visibility || "public";

          const newRoom = await databases.createDocument(
            DB_ID,
            COLLECTIONS.ROOMS,
            ID.unique(),
            {
              name: requestedName,
              subject: requestedSubject,
              curriculumId: requestedCurriculumId,
              activeUsers: 1,
              isStrict: requestedIsStrict,
              roomId: roomId,
              creatorId: user.$id,
              participants: JSON.stringify({ durations: requestedDurations }),
              timerState: "idle",
              timeRemaining: requestedDurations.pomodoro,
              mode: "pomodoro",
              visibility: requestedVisibility,
            },
            [
              Permission.read(Role.any()),
              Permission.update(Role.user(user.$id)),
              Permission.delete(Role.user(user.$id)),
            ]
          );
          currentRoom = newRoom as unknown as Room;
          serverOffsetMsRef.current = estimateServerOffsetMs(currentRoom);
          setRoom(currentRoom);
          setLocalTimeRemaining(requestedDurations.pomodoro);

          // Add creator as first participant
          await databases.createDocument(
            DB_ID,
            COLLECTIONS.ROOM_PARTICIPANTS,
            ID.unique(),
            {
              roomId: roomId,
              userId: user.$id,
              username: profile.username,
              joinedAt: new Date().toISOString(),
            },
            [
              Permission.read(Role.any()),
              Permission.update(Role.user(user.$id)),
              Permission.delete(Role.user(user.$id)),
            ]
          );
        }

        // Fetch all participants
        const participantsResponse = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.ROOM_PARTICIPANTS,
          [Query.equal("roomId", roomId)]
        );
        setParticipants(
          participantsResponse.documents as unknown as RoomParticipant[]
        );
      } catch (error) {
        console.error("Failed to initialize room:", error);
      } finally {
        setRoomLoading(false);
      }
    };

    initRoom();
  }, [user, profile, roomId]);

  // Fetch available curricula for schedule (using PUBLIC_CURRICULUM for wider selection)
  useEffect(() => {
    const fetchCurricula = async () => {
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PUBLIC_CURRICULUM,
          [Query.limit(100)]
        );
        setAvailableCurricula(response.documents as unknown as Curriculum[]);
      } catch (error) {
        console.error("Failed to fetch curricula:", error);
      }
    };
    fetchCurricula();
  }, []);

  // Load schedule from room when room data changes
  useEffect(() => {
    if (room?.schedule) {
      try {
        const parsed = JSON.parse(room.schedule);
        if (parsed.items && Array.isArray(parsed.items)) {
          setScheduleItems(parsed.items);
        }
        if (typeof parsed.visible === "boolean") {
          setScheduleVisible(parsed.visible);
        }
        if (typeof parsed.currentIndex === "number") {
          setCurrentScheduleIndex(parsed.currentIndex);
        }
        if (typeof parsed.running === "boolean") {
          setScheduleRunning(parsed.running);
        }
      } catch {
        // Invalid schedule JSON, ignore
      }
    }
  }, [room?.schedule]);

  // Parse subjects when curriculum selection changes
  useEffect(() => {
    if (!selectedCurriculumId) {
      setParsedSubjects([]);
      return;
    }
    const curriculum = availableCurricula.find(
      (c) => c.$id === selectedCurriculumId
    );
    if (curriculum?.subjects) {
      try {
        const subjects = JSON.parse(curriculum.subjects) as CurriculumSubject[];
        setParsedSubjects(subjects);
      } catch {
        setParsedSubjects([]);
      }
    } else {
      setParsedSubjects([]);
    }
    setSelectedSubjectName("");
    setSelectedTopicName("");
  }, [selectedCurriculumId, availableCurricula]);

  // Request timer sync when joining as a participant (not creator)
  useEffect(() => {
    if (!room || !user || !isConnected) return;
    // Only request sync if we're a participant (not the creator)
    if (room.creatorId === user.$id) return;

    // Request timer sync from creator
    sendMessage("timer-sync-request", { roomId });
  }, [room?.$id, user?.$id, isConnected]);

  // Maintain presence roster from Cloudflare WS
  useEffect(() => {
    const newMessages = messages.slice(lastMessageIndexRef.current);
    lastMessageIndexRef.current = messages.length;

    for (const message of newMessages) {
      if (message.type === "presence-roster" && message.data?.users) {
        const users = message.data.users as PresenceUser[];
        setPresenceUsers(dedupeUsers(users));
      }

      if (message.type === "presence-update" && message.data?.user) {
        const status = message.data.status as "joined" | "left";
        const userInfo = message.data.user as PresenceUser;

        setPresenceUsers((prev) => {
          const without = prev.filter((u) => u.userId !== userInfo.userId);
          return status === "joined"
            ? dedupeUsers([...without, userInfo])
            : dedupeUsers(without);
        });

        // If someone joined and we're the creator, broadcast current timer state
        if (
          status === "joined" &&
          room &&
          user &&
          room.creatorId === user.$id
        ) {
          const currentTime = computeDerivedRemaining(
            room,
            serverOffsetMsRef.current
          );
          sendMessage("timer-sync", {
            action:
              room.timerState === "running"
                ? "play"
                : room.timerState === "paused"
                ? "pause"
                : "reset",
            timeRemaining: currentTime,
            mode: room.mode,
          });
        }
      }

      // Handle timer sync request from participants
      if (
        message.type === "timer-sync-request" &&
        room &&
        user &&
        room.creatorId === user.$id
      ) {
        const currentTime = computeDerivedRemaining(
          room,
          serverOffsetMsRef.current
        );
        sendMessage("timer-sync", {
          action:
            room.timerState === "running"
              ? "play"
              : room.timerState === "paused"
              ? "pause"
              : "reset",
          timeRemaining: currentTime,
          mode: room.mode,
        });
      }

      // Handle chat messages
      if (message.type === "chat" && message.data?.message) {
        const chatMsg = {
          id: `${message.userId}-${message.timestamp}`,
          userId: message.userId,
          username: message.username,
          message: message.data.message as string,
          timestamp: message.timestamp,
        };
        setChatMessages((prev) => [...prev.slice(-99), chatMsg]);
        // Increment unread if chat is minimized and message is from others
        if (chatMinimized && message.userId !== user?.$id) {
          setUnreadCount((prev) => prev + 1);
        }
      }

      if (message.type === "timer-sync" && message.data) {
        // Apply creator timer actions immediately for participants.
        // Appwrite realtime remains the source of truth, but this makes UI feel instant.
        setRoom((prev) => {
          if (!prev) return prev;
          if (message.userId !== prev.creatorId) return prev;

          const action = message.data.action as
            | "play"
            | "pause"
            | "reset"
            | "mode-change";

          const nextMode =
            action === "mode-change" && message.data.mode
              ? (message.data.mode as Room["mode"])
              : prev.mode;

          const nextTimeRemaining =
            typeof message.data.timeRemaining === "number"
              ? message.data.timeRemaining
              : prev.timeRemaining;

          const nextTimerState: Room["timerState"] =
            action === "play"
              ? "running"
              : action === "pause"
              ? "paused"
              : "idle";

          // Stamp updatedAt in server-time basis to avoid a jump when Appwrite realtime arrives.
          const updatedAt = new Date(
            Date.now() - serverOffsetMsRef.current
          ).toISOString();
          return {
            ...prev,
            mode: nextMode,
            timerState: nextTimerState,
            timeRemaining: nextTimeRemaining,
            $updatedAt: updatedAt,
          };
        });

        if (typeof message.data.timeRemaining === "number") {
          setLocalTimeRemaining(message.data.timeRemaining);
        }
      }

      if (message.type === "admin-action" && message.data && user) {
        const action = message.data.action as string | undefined;
        const targetUserId = message.data.targetUserId as string | undefined;

        if (targetUserId && targetUserId === user.$id) {
          if (action === "kicked" || action === "banned") {
            (async () => {
              try {
                const participantDocs = await databases.listDocuments(
                  DB_ID,
                  COLLECTIONS.ROOM_PARTICIPANTS,
                  [
                    Query.equal("roomId", roomId),
                    Query.equal("userId", user.$id),
                  ]
                );

                for (const doc of participantDocs.documents) {
                  try {
                    await databases.deleteDocument(
                      DB_ID,
                      COLLECTIONS.ROOM_PARTICIPANTS,
                      doc.$id
                    );
                  } catch {
                    // ignore
                  }
                }
              } catch {
                // ignore
              }

              const untilMs = message.data.untilMs as number | undefined;
              const untilLabel =
                typeof untilMs === "number"
                  ? ` (until ${new Date(untilMs).toLocaleString()})`
                  : "";
              alert(
                action === "banned"
                  ? `You have been banned from this room${untilLabel}.`
                  : "You have been removed from this room."
              );
              router.push("/start-studying");
            })();
          }
        }
      }
    }
  }, [messages]);

  // Cleanup participant on unmount/page leave
  useEffect(() => {
    if (!user) return;

    const cleanupParticipant = async () => {
      try {
        const participantDocs = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.ROOM_PARTICIPANTS,
          [Query.equal("roomId", roomId), Query.equal("userId", user.$id)]
        );

        if (participantDocs.documents.length > 0) {
          await databases.deleteDocument(
            DB_ID,
            COLLECTIONS.ROOM_PARTICIPANTS,
            participantDocs.documents[0].$id
          );
        }
      } catch (error) {
        console.error("Failed to cleanup participant:", error);
      }
    };

    // Cleanup on page unload (browser close, navigation)
    const handleBeforeUnload = () => {
      cleanupParticipant();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      cleanupParticipant();
    };
  }, [user?.$id, roomId]);

  // Subscribe to room updates (realtime websocket)
  useEffect(() => {
    if (!room) return;

    // Subscribe to room changes
    const roomUnsubscribe = client.subscribe(
      `databases.${DB_ID}.collections.${COLLECTIONS.ROOMS}.documents.${room.$id}`,
      (response) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          )
        ) {
          const updatedRoom = response.payload as unknown as Room;
          serverOffsetMsRef.current = estimateServerOffsetMs(updatedRoom);
          setRoom(updatedRoom);
          // Derived timer will update localTimeRemaining from room state
        }

        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.delete"
          )
        ) {
          router.push("/start-studying");
        }
      }
    );

    // Subscribe to participants changes
    const participantsUnsubscribe = client.subscribe(
      `databases.${DB_ID}.collections.${COLLECTIONS.ROOM_PARTICIPANTS}.documents`,
      async (response) => {
        // Refetch participants when someone joins or leaves
        if (
          response.events.some(
            (e) =>
              e.includes("create") ||
              e.includes("delete") ||
              e.includes("update")
          )
        ) {
          try {
            const participantsResponse = await databases.listDocuments(
              DB_ID,
              COLLECTIONS.ROOM_PARTICIPANTS,
              [Query.equal("roomId", roomId)]
            );
            setParticipants(
              participantsResponse.documents as unknown as RoomParticipant[]
            );
          } catch (error) {
            console.error("Failed to fetch participants:", error);
          }
        }
      }
    );

    return () => {
      roomUnsubscribe();
      participantsUnsubscribe();
    };
  }, [room, roomId, router]);

  // Keep local config draft in sync with room (creator only)
  useEffect(() => {
    if (!room || !user) return;
    if (room.creatorId !== user.$id) return;

    setConfigDraft({
      name: room.name || "",
      subject: room.subject || "",
      isStrict: Boolean(room.isStrict),
      pomodoroMin: Math.round(roomDurations.pomodoro / 60),
      shortBreakMin: Math.round(roomDurations["short-break"] / 60),
      longBreakMin: Math.round(roomDurations["long-break"] / 60),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.$id, room?.creatorId, user?.$id]);

  const handleSaveConfig = async () => {
    if (!room || !user) return;
    if (room.creatorId !== user.$id) return;
    if (!configDraft) return;

    const clampMin = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));
    const newDurations = {
      pomodoro: clampMin(Number(configDraft.pomodoroMin) || 25, 1, 600) * 60,
      "short-break":
        clampMin(Number(configDraft.shortBreakMin) || 5, 1, 600) * 60,
      "long-break":
        clampMin(Number(configDraft.longBreakMin) || 15, 1, 600) * 60,
    } as Record<Room["mode"], number>;

    setConfigSaving(true);
    try {
      const shouldResetIdle = room.timerState === "idle";

      await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
        name: configDraft.name?.trim() || room.name,
        subject: configDraft.subject?.trim() || room.subject,
        isStrict: Boolean(configDraft.isStrict),
        participants: JSON.stringify({ durations: newDurations }),
        ...(shouldResetIdle ? { timeRemaining: newDurations[room.mode] } : {}),
      });

      if (shouldResetIdle) {
        setLocalTimeRemaining(newDurations[room.mode]);
      }
    } catch (error) {
      console.error("Failed to save room config:", error);
    } finally {
      setConfigSaving(false);
    }
  };

  // Track if we've already handled completion for current timer cycle
  const timerCompletedRef = useRef(false);

  // Derived timer display (single source of truth: Appwrite room doc + $updatedAt)
  useEffect(() => {
    if (!room) return;
    const tick = () =>
      setLocalTimeRemaining(
        computeDerivedRemaining(room, serverOffsetMsRef.current)
      );
    tick();
    const intervalId = setInterval(tick, 250);
    return () => clearInterval(intervalId);
  }, [
    room?.$id,
    room?.timerState,
    room?.timeRemaining,
    room?.$updatedAt,
    room?.mode,
  ]);

  const handleTimerComplete = async () => {
    if (!room) return;

    if (soundEnabled) {
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
      );
      audio.play().catch((e) => console.error("Audio play failed", e));
    }

    try {
      // Check if we're running a schedule (only creator handles schedule progression)
      const isRoomCreator = user && room.creatorId === user.$id;
      if (scheduleRunning && scheduleItems.length > 0 && isRoomCreator) {
        // Mark current item as completed
        const updatedItems = scheduleItems.map((item, idx) =>
          idx === currentScheduleIndex ? { ...item, completed: true } : item
        );

        // Check if there's a next item
        const nextIndex = currentScheduleIndex + 1;
        if (nextIndex < scheduleItems.length) {
          const nextItem = scheduleItems[nextIndex];
          const nextDuration = nextItem.duration * 60; // Convert minutes to seconds

          // Save updated schedule and start next timer
          const scheduleData = JSON.stringify({
            items: updatedItems,
            visible: scheduleVisible,
            currentIndex: nextIndex,
            running: true,
          });

          await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
            schedule: scheduleData,
            timerState: "running",
            timeRemaining: nextDuration,
            mode: nextItem.isBreak ? "short-break" : "pomodoro",
          });

          setScheduleItems(updatedItems);
          setCurrentScheduleIndex(nextIndex);
          setLocalTimeRemaining(nextDuration);
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  timerState: "running",
                  timeRemaining: nextDuration,
                  mode: nextItem.isBreak ? "short-break" : "pomodoro",
                  schedule: scheduleData,
                  $updatedAt: new Date().toISOString(),
                }
              : prev
          );

          // Broadcast timer sync
          sendMessage("timer-sync", {
            action: "play",
            timeRemaining: nextDuration,
            mode: nextItem.isBreak ? "short-break" : "pomodoro",
          });
          return;
        } else {
          // Schedule complete
          const scheduleData = JSON.stringify({
            items: updatedItems,
            visible: scheduleVisible,
            currentIndex: 0,
            running: false,
          });

          await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
            schedule: scheduleData,
            timerState: "idle",
            timeRemaining: roomDurations.pomodoro,
            mode: "pomodoro",
          });

          setScheduleItems(updatedItems);
          setScheduleRunning(false);
          setCurrentScheduleIndex(0);
          setLocalTimeRemaining(roomDurations.pomodoro);
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  timerState: "idle",
                  timeRemaining: roomDurations.pomodoro,
                  mode: "pomodoro",
                  schedule: scheduleData,
                  $updatedAt: new Date().toISOString(),
                }
              : prev
          );
          return;
        }
      }

      const shouldAutoStart =
        (room.mode === "pomodoro" && autoStartBreak) ||
        (room.mode !== "pomodoro" && autoStartFocus);

      if (shouldAutoStart) {
        // Auto-start next mode
        const nextMode: Room["mode"] =
          room.mode === "pomodoro" ? "short-break" : "pomodoro";
        await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
          mode: nextMode,
          timerState: "running",
          timeRemaining: roomDurations[nextMode],
        });

        setRoom((prev) =>
          prev
            ? {
                ...prev,
                mode: nextMode,
                timerState: "running",
                timeRemaining: roomDurations[nextMode],
                $updatedAt: new Date().toISOString(),
              }
            : prev
        );
        setLocalTimeRemaining(roomDurations[nextMode]);
      } else {
        await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
          timerState: "idle",
          timeRemaining: roomDurations[room.mode],
        });

        setRoom((prev) =>
          prev
            ? {
                ...prev,
                timerState: "idle",
                timeRemaining: roomDurations[prev.mode],
                $updatedAt: new Date().toISOString(),
              }
            : prev
        );
        setLocalTimeRemaining(roomDurations[room.mode]);
      }
    } catch (error) {
      console.error("Failed to complete timer:", error);
    }
  };

  // Detect when timer reaches 0 and trigger completion
  useEffect(() => {
    if (!room || room.timerState !== "running") {
      timerCompletedRef.current = false;
      return;
    }

    if (localTimeRemaining <= 0 && !timerCompletedRef.current) {
      timerCompletedRef.current = true;
      handleTimerComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTimeRemaining, room?.timerState]);

  const handlePlayPause = async () => {
    if (!room || !user) return;
    if (room.creatorId !== user.$id) return;
    try {
      const newState = room.timerState === "running" ? "paused" : "running";
      const derivedNow = computeDerivedRemaining(
        room,
        serverOffsetMsRef.current
      );
      await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
        timerState: newState,
        timeRemaining: derivedNow,
      });

      setRoom((prev) =>
        prev
          ? {
              ...prev,
              timerState: newState,
              timeRemaining: derivedNow,
              $updatedAt: new Date().toISOString(),
            }
          : prev
      );
      setLocalTimeRemaining(derivedNow);

      // Broadcast action via WebSocket
      sendMessage("timer-sync", {
        action: newState === "running" ? "play" : "pause",
        timeRemaining: derivedNow,
      });
    } catch (error) {
      console.error("Failed to toggle timer:", error);
    }
  };

  const handleReset = async () => {
    if (!room || !user) return;
    if (room.creatorId !== user.$id) return;
    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
        timerState: "idle",
        timeRemaining: roomDurations[room.mode],
      });

      setRoom((prev) =>
        prev
          ? {
              ...prev,
              timerState: "idle",
              timeRemaining: roomDurations[prev.mode],
              $updatedAt: new Date().toISOString(),
            }
          : prev
      );
      setLocalTimeRemaining(roomDurations[room.mode]);

      // Broadcast action via WebSocket
      sendMessage("timer-sync", {
        action: "reset",
        timeRemaining: roomDurations[room.mode],
      });
    } catch (error) {
      console.error("Failed to reset timer:", error);
    }
  };

  const handleModeChange = async (
    mode: "pomodoro" | "short-break" | "long-break"
  ) => {
    if (!room || !user) return;
    if (room.creatorId !== user.$id) return;
    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
        mode: mode,
        timeRemaining: roomDurations[mode],
        timerState: "idle",
      });

      setRoom((prev) =>
        prev
          ? {
              ...prev,
              mode,
              timerState: "idle",
              timeRemaining: roomDurations[mode],
              $updatedAt: new Date().toISOString(),
            }
          : prev
      );
      setLocalTimeRemaining(roomDurations[mode]);

      // Broadcast action via WebSocket
      sendMessage("timer-sync", {
        action: "mode-change",
        mode: mode,
        timeRemaining: roomDurations[mode],
      });
    } catch (error) {
      console.error("Failed to change mode:", error);
    }
  };

  const handleLeaveRoom = async () => {
    if (!room || !user) return;
    try {
      // Find and delete user's participant document
      const participantDocs = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.ROOM_PARTICIPANTS,
        [Query.equal("roomId", roomId), Query.equal("userId", user.$id)]
      );

      if (participantDocs.documents.length > 0) {
        await databases.deleteDocument(
          DB_ID,
          COLLECTIONS.ROOM_PARTICIPANTS,
          participantDocs.documents[0].$id
        );
      }

      // Check if there are any remaining participants
      const remainingParticipants = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.ROOM_PARTICIPANTS,
        [Query.equal("roomId", roomId)]
      );

      if (remainingParticipants.documents.length === 0) {
        // Last person leaving, delete room
        await databases.deleteDocument(DB_ID, COLLECTIONS.ROOMS, room.$id);
      }

      router.push("/start-studying");
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const handleDeleteRoom = async () => {
    if (!room || !user || room.creatorId !== user.$id) return;

    if (
      !confirm(
        "Are you sure you want to delete this room? All participants will be removed."
      )
    ) {
      return;
    }

    try {
      // Delete all participants
      const allParticipants = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.ROOM_PARTICIPANTS,
        [Query.equal("roomId", roomId)]
      );

      for (const participant of allParticipants.documents) {
        await databases.deleteDocument(
          DB_ID,
          COLLECTIONS.ROOM_PARTICIPANTS,
          participant.$id
        );
      }

      // Delete room
      await databases.deleteDocument(DB_ID, COLLECTIONS.ROOMS, room.$id);

      router.push("/start-studying");
    } catch (error) {
      console.error("Failed to delete room:", error);
    }
  };

  const updateRoomBan = async (
    targetUserId: string,
    ban: { type: "temporary"; untilMs: number } | { type: "permanent" } | null
  ) => {
    if (!room || !user || room.creatorId !== user.$id) return;
    try {
      const config = parseRoomConfig(room);
      const bans = { ...(config.bans ?? {}) };

      if (ban) bans[targetUserId] = ban;
      else delete bans[targetUserId];

      const nextConfig = {
        ...config,
        bans,
      };

      const updated = await databases.updateDocument(
        DB_ID,
        COLLECTIONS.ROOMS,
        room.$id,
        {
          participants: JSON.stringify(nextConfig),
        }
      );
      setRoom(updated as unknown as Room);
    } catch (error) {
      console.error("Failed to update ban list:", error);
    }
  };

  const handleModerateUser = async (
    targetUserId: string,
    mode: "kick-temp" | "ban-perm"
  ) => {
    if (!room || !user || room.creatorId !== user.$id) return;
    if (!targetUserId) return;

    const TEMP_MINUTES = 10;
    const untilMs = Date.now() + TEMP_MINUTES * 60 * 1000;

    try {
      if (mode === "kick-temp") {
        await updateRoomBan(targetUserId, { type: "temporary", untilMs });
        sendMessage("admin-action", {
          action: "ban",
          targetUserId,
          permanent: false,
          durationMs: TEMP_MINUTES * 60 * 1000,
        });
      } else {
        await updateRoomBan(targetUserId, { type: "permanent" });
        sendMessage("admin-action", {
          action: "ban",
          targetUserId,
          permanent: true,
        });
      }

      // Best-effort: delete participant docs (kicked client will also self-cleanup).
      const participantDocs = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.ROOM_PARTICIPANTS,
        [Query.equal("roomId", roomId), Query.equal("userId", targetUserId)]
      );

      for (const doc of participantDocs.documents) {
        try {
          await databases.deleteDocument(
            DB_ID,
            COLLECTIONS.ROOM_PARTICIPANTS,
            doc.$id
          );
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error("Failed to moderate user:", error);
    }
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Chat functions
  const handleSendChat = () => {
    if (!chatInput.trim() || !user || !profile) return;
    sendMessage("chat", { message: chatInput.trim() });
    // Add own message locally immediately
    const chatMsg = {
      id: `${user.$id}-${new Date().toISOString()}`,
      userId: user.$id,
      username: profile.username,
      message: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev.slice(-99), chatMsg]);
    setChatInput("");
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const toggleChat = () => {
    setChatMinimized(!chatMinimized);
    if (chatMinimized) {
      setUnreadCount(0);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (!chatMinimized && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatMinimized]);

  // Schedule functions
  const handleAddScheduleItem = () => {
    if (!selectedCurriculumId) return;
    const curriculum = availableCurricula.find(
      (c) => c.$id === selectedCurriculumId
    );
    if (!curriculum) return;

    const newItem: ScheduleItem = {
      id: ID.unique(),
      curriculumId: selectedCurriculumId,
      curriculumName: curriculum.name,
      subjectId: selectedSubjectName || undefined,
      subjectName: selectedSubjectName || undefined,
      topicId: selectedTopicName || undefined,
      topicName: selectedTopicName || undefined,
      duration: scheduleDuration,
      order: scheduleItems.length,
      completed: false,
      isBreak: false,
    };

    setScheduleItems([...scheduleItems, newItem]);
    setSelectedCurriculumId("");
    setSelectedSubjectName("");
    setSelectedTopicName("");
    setScheduleDuration(25);
  };

  const handleAddBreakItem = () => {
    const newItem: ScheduleItem = {
      id: ID.unique(),
      curriculumId: "break",
      curriculumName: "Break",
      duration: breakDuration,
      order: scheduleItems.length,
      completed: false,
      isBreak: true,
    };

    setScheduleItems([...scheduleItems, newItem]);
    setBreakDuration(5);
  };

  const handleRemoveScheduleItem = (id: string) => {
    setScheduleItems(scheduleItems.filter((item) => item.id !== id));
  };

  const handleStartEditItem = (item: ScheduleItem) => {
    setEditingItemId(item.id);
    setEditItemData({
      curriculumId: item.curriculumId,
      subjectName: item.subjectName || "",
      topicName: item.topicName || "",
      duration: item.duration,
    });
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditItemData(null);
  };

  const handleSaveEditItem = () => {
    if (!editingItemId || !editItemData) return;

    const itemToEdit = scheduleItems.find((item) => item.id === editingItemId);
    if (!itemToEdit) return;

    if (itemToEdit.isBreak) {
      // For break items, only update duration
      setScheduleItems(
        scheduleItems.map((item) =>
          item.id === editingItemId
            ? { ...item, duration: editItemData.duration }
            : item
        )
      );
    } else {
      // For study items, update curriculum, subject, topic, and duration
      const curriculum = availableCurricula.find(
        (c) => c.$id === editItemData.curriculumId
      );

      setScheduleItems(
        scheduleItems.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                curriculumId: editItemData.curriculumId,
                curriculumName: curriculum?.name || item.curriculumName,
                subjectName: editItemData.subjectName || undefined,
                topicName: editItemData.topicName || undefined,
                duration: editItemData.duration,
              }
            : item
        )
      );
    }

    setEditingItemId(null);
    setEditItemData(null);
  };

  // Get subjects for the curriculum being edited
  const getEditSubjects = (): CurriculumSubject[] => {
    if (!editItemData?.curriculumId) return [];
    const curriculum = availableCurricula.find(
      (c) => c.$id === editItemData.curriculumId
    );
    if (!curriculum?.subjects) return [];
    try {
      return JSON.parse(curriculum.subjects) as CurriculumSubject[];
    } catch {
      return [];
    }
  };

  // Get topics for the subject being edited
  const getEditTopics = (): string[] => {
    if (!editItemData?.subjectName) return [];
    const subjects = getEditSubjects();
    const subject = subjects.find((s) => s.name === editItemData.subjectName);
    return subject?.topics || [];
  };

  const handleToggleScheduleItemComplete = (id: string) => {
    setScheduleItems(
      scheduleItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleSaveSchedule = async () => {
    if (!room || !user || room.creatorId !== user.$id) return;
    setScheduleSaving(true);
    try {
      const scheduleData = JSON.stringify({
        items: scheduleItems,
        visible: scheduleVisible,
        currentIndex: currentScheduleIndex,
        running: scheduleRunning,
      });
      await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
        schedule: scheduleData,
      });
      setRoom({ ...room, schedule: scheduleData });
    } catch (error) {
      console.error("Failed to save schedule:", error);
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleStartSchedule = async () => {
    if (!room || !user || room.creatorId !== user.$id) return;
    if (scheduleItems.length === 0) return;

    // Reset all items to incomplete and start from first
    const resetItems = scheduleItems.map((item) => ({
      ...item,
      completed: false,
    }));
    const firstItem = resetItems[0];
    const firstDuration = firstItem.duration * 60;

    setScheduleItems(resetItems);
    setCurrentScheduleIndex(0);
    setScheduleRunning(true);

    try {
      const scheduleData = JSON.stringify({
        items: resetItems,
        visible: scheduleVisible,
        currentIndex: 0,
        running: true,
      });

      await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
        schedule: scheduleData,
        timerState: "running",
        timeRemaining: firstDuration,
        mode: firstItem.isBreak ? "short-break" : "pomodoro",
      });

      setLocalTimeRemaining(firstDuration);
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              timerState: "running",
              timeRemaining: firstDuration,
              mode: firstItem.isBreak ? "short-break" : "pomodoro",
              schedule: scheduleData,
              $updatedAt: new Date().toISOString(),
            }
          : prev
      );

      // Broadcast timer sync
      sendMessage("timer-sync", {
        action: "play",
        timeRemaining: firstDuration,
        mode: firstItem.isBreak ? "short-break" : "pomodoro",
      });
    } catch (error) {
      console.error("Failed to start schedule:", error);
      setScheduleRunning(false);
    }
  };

  const handleStopSchedule = async () => {
    if (!room || !user || room.creatorId !== user.$id) return;

    setScheduleRunning(false);

    try {
      const scheduleData = JSON.stringify({
        items: scheduleItems,
        visible: scheduleVisible,
        currentIndex: currentScheduleIndex,
        running: false,
      });

      await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
        schedule: scheduleData,
        timerState: "paused",
      });

      setRoom((prev) =>
        prev
          ? {
              ...prev,
              timerState: "paused",
              schedule: scheduleData,
              $updatedAt: new Date().toISOString(),
            }
          : prev
      );

      sendMessage("timer-sync", {
        action: "pause",
        timeRemaining: localTimeRemaining,
      });
    } catch (error) {
      console.error("Failed to stop schedule:", error);
    }
  };

  const handleMoveScheduleItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === scheduleItems.length - 1) return;

    const newItems = [...scheduleItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];

    // Update order values
    newItems.forEach((item, i) => {
      item.order = i;
    });

    setScheduleItems(newItems);
  };

  const getSelectedTopics = (): string[] => {
    if (!selectedSubjectName) return [];
    const subject = parsedSubjects.find((s) => s.name === selectedSubjectName);
    return subject?.topics || [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const themeClasses = {
    indigo: {
      bg: "bg-indigo-600",
      text: "text-indigo-400",
      border: "border-indigo-500/30",
      ring: "ring-indigo-500/20",
      glow: "bg-indigo-500/5",
      hover: "hover:bg-indigo-500",
      gradient: "from-indigo-500 to-purple-500",
    },
    cyan: {
      bg: "bg-cyan-600",
      text: "text-cyan-400",
      border: "border-cyan-500/30",
      ring: "ring-cyan-500/20",
      glow: "bg-cyan-500/5",
      hover: "hover:bg-cyan-500",
      gradient: "from-cyan-500 to-blue-500",
    },
    green: {
      bg: "bg-green-600",
      text: "text-green-400",
      border: "border-green-500/30",
      ring: "ring-green-500/20",
      glow: "bg-green-500/5",
      hover: "hover:bg-green-500",
      gradient: "from-green-500 to-emerald-500",
    },
    amber: {
      bg: "bg-amber-600",
      text: "text-amber-400",
      border: "border-amber-500/30",
      ring: "ring-amber-500/20",
      glow: "bg-amber-500/5",
      hover: "hover:bg-amber-500",
      gradient: "from-amber-500 to-orange-500",
    },
    rose: {
      bg: "bg-rose-600",
      text: "text-rose-400",
      border: "border-rose-500/30",
      ring: "ring-rose-500/20",
      glow: "bg-rose-500/5",
      hover: "hover:bg-rose-500",
      gradient: "from-rose-500 to-pink-500",
    },
    violet: {
      bg: "bg-violet-600",
      text: "text-violet-400",
      border: "border-violet-500/30",
      ring: "ring-violet-500/20",
      glow: "bg-violet-500/5",
      hover: "hover:bg-violet-500",
      gradient: "from-violet-500 to-purple-500",
    },
  };

  const currentTheme = themeClasses[themeColor];
  const isBreak = room?.mode === "short-break" || room?.mode === "long-break";

  const renderTimer = () => {
    const time = formatTime(localTimeRemaining);
    switch (timerStyle) {
      case "digital":
        return (
          <DigitalTimerDisplay
            time={time}
            size="lg"
            isBreak={isBreak}
            themeColor={themeColor}
            timerFont={timerFont}
          />
        );
      case "circular":
        return (
          <CircularTimerDisplay
            time={time}
            progress={
              ((roomDurations[room?.mode || "pomodoro"] - localTimeRemaining) /
                roomDurations[room?.mode || "pomodoro"]) *
              100
            }
            size="lg"
            isBreak={isBreak}
            themeColor={themeColor}
            timerFont={timerFont}
          />
        );
      case "minimal":
        return (
          <MinimalTimerDisplay
            time={time}
            size="lg"
            isBreak={isBreak}
            themeColor={themeColor}
            timerFont={timerFont}
          />
        );
      case "grid":
      default:
        return (
          <GridTimerDisplay
            time={time}
            themeColor={themeColor}
            isBreak={isBreak}
          />
        );
    }
  };

  if (loading || roomLoading) {
    return (
      <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </main>
    );
  }

  if (!user || !room) return null;

  const isCreator = room.creatorId === user.$id;
  const fallbackUsers = dedupeUsers(
    participants.map((p) => {
      const profileData = participantProfiles.get(p.userId);
      return {
        userId: p.userId,
        username: profileData?.username || p.username,
        profilePicture: profileData?.profilePicture,
      };
    })
  );
  const displayUsers: Array<{
    userId: string;
    username: string;
    profilePicture?: string;
  }> =
    isConnected && presenceUsers.length > 0
      ? dedupeUsers(
          presenceUsers.map((pu) => ({
            ...pu,
            profilePicture: participantProfiles.get(pu.userId)?.profilePicture,
          }))
        )
      : fallbackUsers;

  return (
    <main
      className={clsx(
        "relative min-h-screen transition-all",
        isFullScreen
          ? "fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center p-0"
          : "pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20"
      )}
    >
      {isFullScreen ? (
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
              {room?.name || "Study Room"}
            </h1>
            <p
              className={clsx(
                "text-sm sm:text-base md:text-lg font-medium",
                isBreak ? "text-green-400" : currentTheme.text
              )}
            >
              {room?.subject || "General"} •{" "}
              {room?.mode === "pomodoro"
                ? "Focus Time"
                : room?.mode === "short-break"
                ? "Short Break"
                : "Long Break"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl h-1.5 md:h-2 bg-zinc-800/50 rounded-full mb-8 md:mb-12 overflow-hidden z-10 px-4">
            <div
              className={clsx(
                "h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_20px_currentColor]",
                isBreak
                  ? "bg-green-500 text-green-500"
                  : clsx(currentTheme.bg, currentTheme.text)
              )}
              style={{
                width: `${
                  ((roomDurations[room?.mode || "pomodoro"] -
                    localTimeRemaining) /
                    roomDurations[room?.mode || "pomodoro"]) *
                  100
                }%`,
              }}
            ></div>
          </div>

          {/* Timer Display */}
          <div className="z-10 mb-8 md:mb-12">
            <div className="scale-90 sm:scale-110 md:scale-125">
              {renderTimer()}
            </div>
          </div>

          {/* Controls - Creator Only */}
          {isCreator && (
            <div className="flex items-center gap-8 z-10">
              <button
                onClick={handlePlayPause}
                className={clsx(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl text-white",
                  room?.timerState === "running"
                    ? "bg-yellow-500 hover:bg-yellow-400"
                    : clsx(currentTheme.bg, currentTheme.hover)
                )}
              >
                {room?.timerState === "running" ? (
                  <Pause size={32} fill="currentColor" />
                ) : (
                  <Play size={32} fill="currentColor" />
                )}
              </button>
              <button
                onClick={handleReset}
                className="w-20 h-20 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all hover:scale-110 shadow-xl"
              >
                <RotateCcw size={32} />
              </button>
            </div>
          )}

          {/* Participants indicator */}
          <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 text-center z-10 px-4">
            <p className="text-zinc-500 text-xs sm:text-sm flex items-center gap-2">
              <Users size={16} />
              {displayUsers.length}{" "}
              {displayUsers.length === 1 ? "participant" : "participants"}
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
            <div>
              <h1
                className={clsx(
                  "text-2xl md:text-3xl font-medium mb-2",
                  currentTheme.text
                )}
              >
                {room?.name || "Study Room"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-zinc-400">
                  {room?.subject || "General"}
                </span>
                <span className="text-zinc-600">•</span>
                <code className="text-xs md:text-sm text-zinc-400 bg-zinc-900 px-2 md:px-3 py-1 rounded">
                  {roomId}
                </code>
                <button
                  onClick={handleCopyRoomCode}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                  title="Copy room code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                {/* Private Room Indicator */}
                {room?.visibility === "private" && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20">
                      <Lock className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-purple-400">Private</span>
                    </div>
                  </>
                )}

                {/* WebSocket Status Indicator */}
                <div
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  title={`WebSocket: ${connectionStatus}`}
                >
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Live</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-zinc-500" />
                      <span className="text-zinc-500">{connectionStatus}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  "hover:bg-white/5 text-zinc-400 hover:text-white"
                )}
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  "hover:bg-white/5 text-zinc-400 hover:text-white"
                )}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              {isCreator && (
                <button
                  onClick={handleDeleteRoom}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                  title="Delete Room"
                >
                  <LogOut className="w-4 h-4" />
                  Delete
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Leave
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Timer Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Schedule Running Indicator */}
              {scheduleRunning && scheduleItems[currentScheduleIndex] && (
                <div
                  className={clsx(
                    "flex items-center gap-3 p-4 rounded-lg border",
                    scheduleItems[currentScheduleIndex].isBreak
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-indigo-500/10 border-indigo-500/30"
                  )}
                >
                  {scheduleItems[currentScheduleIndex].isBreak ? (
                    <Coffee className="w-5 h-5 text-amber-400" />
                  ) : (
                    <PlayCircle className="w-5 h-5 text-indigo-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "text-sm font-medium",
                          scheduleItems[currentScheduleIndex].isBreak
                            ? "text-amber-400"
                            : "text-white"
                        )}
                      >
                        {scheduleItems[currentScheduleIndex].curriculumName}
                      </span>
                      {scheduleItems[currentScheduleIndex].subjectName && (
                        <span className="text-xs text-zinc-500">
                          • {scheduleItems[currentScheduleIndex].subjectName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500">
                        Item {currentScheduleIndex + 1} of{" "}
                        {scheduleItems.length}
                      </span>
                      <span className="text-xs text-zinc-600">•</span>
                      <span className="text-xs text-zinc-500">
                        {scheduleItems.filter((s) => s.completed).length}{" "}
                        completed
                      </span>
                    </div>
                  </div>
                  {isCreator && (
                    <button
                      onClick={handleStopSchedule}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Stop
                    </button>
                  )}
                </div>
              )}

              {/* Mode Selector */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleModeChange("pomodoro")}
                  disabled={!isCreator}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    room.mode === "pomodoro"
                      ? clsx(currentTheme.bg, "text-white shadow-lg")
                      : "bg-zinc-900 text-zinc-400 hover:text-white",
                    !isCreator && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Pomodoro
                </button>
                <button
                  onClick={() => handleModeChange("short-break")}
                  disabled={!isCreator}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    room.mode === "short-break"
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-zinc-900 text-zinc-400 hover:text-white",
                    !isCreator && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Short Break
                </button>
                <button
                  onClick={() => handleModeChange("long-break")}
                  disabled={!isCreator}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    room.mode === "long-break"
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-zinc-900 text-zinc-400 hover:text-white",
                    !isCreator && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Long Break
                </button>
              </div>

              {/* Timer Display */}
              <div
                className={clsx(
                  "card-glass p-8 md:p-12 relative overflow-hidden transition-all",
                  room.timerState === "running" && currentTheme.border
                )}
              >
                {/* Background Effects */}
                {room.timerState === "running" && visualMode !== "minimal" && (
                  <>
                    <div
                      className={clsx(
                        "absolute inset-0 animate-pulse pointer-events-none",
                        currentTheme.glow
                      )}
                    ></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] pointer-events-none"></div>
                    {visualMode === "cyber" && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[20%] w-full animate-[scan_4s_linear_infinite] pointer-events-none"></div>
                    )}
                  </>
                )}

                <div className="flex flex-col items-center relative z-10">
                  <div className="mb-8 md:mb-12">{renderTimer()}</div>

                  {/* Timer Controls */}
                  <div className="flex gap-4">
                    <button
                      onClick={handlePlayPause}
                      disabled={!isCreator}
                      className={clsx(
                        "flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-lg font-medium text-sm md:text-base transition-all",
                        room.timerState === "running"
                          ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                          : clsx(
                              currentTheme.bg,
                              currentTheme.hover,
                              "text-white"
                            ),
                        !isCreator && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {room.timerState === "running" ? (
                        <>
                          <Pause className="w-4 h-4 md:w-5 md:h-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 md:w-5 md:h-5" />
                          Start
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={!isCreator}
                      className={clsx(
                        "flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm md:text-base transition-all",
                        !isCreator && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="card-glass p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className={clsx("w-5 h-5", currentTheme.text)} />
                  <span className="text-sm font-medium text-zinc-300">
                    Session Progress
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      "h-full transition-all duration-1000 bg-gradient-to-r",
                      isBreak
                        ? "from-green-500 to-emerald-500"
                        : currentTheme.gradient
                    )}
                    style={{
                      width: `${
                        ((roomDurations[room.mode] - localTimeRemaining) /
                          roomDurations[room.mode]) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Participants Sidebar */}
            <div className="space-y-6">
              <div className="card-glass p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Users className={clsx("w-5 h-5", currentTheme.text)} />
                  <h2 className="text-lg font-medium text-white">
                    Participants ({displayUsers.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {displayUsers.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg"
                    >
                      {participant.profilePicture ? (
                        <img
                          src={participant.profilePicture}
                          alt={participant.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center font-medium",
                            currentTheme.glow,
                            currentTheme.text
                          )}
                        >
                          {participant.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {participant.username}
                        </p>
                        {participant.userId === room.creatorId && (
                          <p className="text-xs text-zinc-500">Room Creator</p>
                        )}
                      </div>
                      {isCreator && participant.userId !== user.$id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleModerateUser(
                                participant.userId,
                                "kick-temp"
                              )
                            }
                            className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
                            title="Kick temporarily (10 minutes)"
                          >
                            Kick
                          </button>
                          <button
                            onClick={() =>
                              handleModerateUser(participant.userId, "ban-perm")
                            }
                            className="px-2 py-1 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                            title="Ban permanently"
                          >
                            Ban
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Config (Creator only) */}
              {isCreator && configDraft && (
                <div className="card-glass p-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-4">
                    Room Config
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Name
                      </label>
                      <input
                        value={configDraft.name}
                        onChange={(e) =>
                          setConfigDraft((prev) =>
                            prev ? { ...prev, name: e.target.value } : prev
                          )
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Subject/Curriculum
                      </label>
                      <input
                        value={configDraft.subject}
                        onChange={(e) =>
                          setConfigDraft((prev) =>
                            prev ? { ...prev, subject: e.target.value } : prev
                          )
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="strict-room"
                        type="checkbox"
                        checked={configDraft.isStrict}
                        onChange={(e) =>
                          setConfigDraft((prev) =>
                            prev
                              ? { ...prev, isStrict: e.target.checked }
                              : prev
                          )
                        }
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor="strict-room"
                        className="text-sm text-zinc-300"
                      >
                        Strict mode
                      </label>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Pomodoro
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={600}
                          value={configDraft.pomodoroMin}
                          onChange={(e) =>
                            setConfigDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    pomodoroMin: Number(e.target.value),
                                  }
                                : prev
                            )
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Short
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={600}
                          value={configDraft.shortBreakMin}
                          onChange={(e) =>
                            setConfigDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    shortBreakMin: Number(e.target.value),
                                  }
                                : prev
                            )
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Long
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={600}
                          value={configDraft.longBreakMin}
                          onChange={(e) =>
                            setConfigDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    longBreakMin: Number(e.target.value),
                                  }
                                : prev
                            )
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveConfig}
                      disabled={configSaving}
                      className={`w-full bg-zinc-800 border border-zinc-700 text-zinc-200 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-zinc-700 transition-colors ${
                        configSaving ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {configSaving ? "Saving..." : "Save Config"}
                    </button>

                    <p className="text-xs text-zinc-500">
                      If the timer is running/paused, durations apply next
                      reset.
                    </p>
                  </div>
                </div>
              )}

              {/* Study Schedule */}
              <div className="card-glass p-6">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowSchedule(!showSchedule)}
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays
                      className={clsx("w-5 h-5", currentTheme.text)}
                    />
                    <h3 className="text-sm font-medium text-zinc-400">
                      Study Schedule
                    </h3>
                    {scheduleItems.length > 0 && (
                      <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">
                        {scheduleItems.filter((s) => s.completed).length}/
                        {scheduleItems.length}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    className={clsx(
                      "w-4 h-4 text-zinc-500 transition-transform",
                      showSchedule && "rotate-90"
                    )}
                  />
                </div>

                {showSchedule && (
                  <div className="mt-4 space-y-4">
                    {/* Schedule visibility toggle (creator only) */}
                    {isCreator && (
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          {scheduleVisible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                          <span>
                            {scheduleVisible
                              ? "Visible to all"
                              : "Hidden from others"}
                          </span>
                        </div>
                        <button
                          onClick={() => setScheduleVisible(!scheduleVisible)}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          {scheduleVisible ? "Hide" : "Show"}
                        </button>
                      </div>
                    )}

                    {/* Schedule Items List */}
                    {(scheduleVisible || isCreator) &&
                      scheduleItems.length > 0 && (
                        <div className="space-y-2">
                          {scheduleItems.map((item, index) => (
                            <div
                              key={item.id}
                              className={clsx(
                                "p-3 rounded-lg transition-all",
                                item.completed
                                  ? "bg-green-500/10 border border-green-500/20"
                                  : index === currentScheduleIndex &&
                                    scheduleRunning
                                  ? item.isBreak
                                    ? "bg-amber-500/10 border border-amber-500/30"
                                    : "bg-indigo-500/10 border border-indigo-500/30"
                                  : item.isBreak
                                  ? "bg-amber-500/5 border border-amber-500/20"
                                  : "bg-zinc-900/50 border border-zinc-800"
                              )}
                            >
                              {/* Edit Mode */}
                              {editingItemId === item.id && editItemData ? (
                                <div className="space-y-3">
                                  {item.isBreak ? (
                                    // Break edit - only duration
                                    <div className="flex items-center gap-2">
                                      <Coffee className="w-4 h-4 text-amber-500" />
                                      <span className="text-sm text-amber-400 font-medium">
                                        Edit Break
                                      </span>
                                    </div>
                                  ) : (
                                    // Study item edit - curriculum, subject, topic
                                    <>
                                      <select
                                        value={editItemData.curriculumId}
                                        onChange={(e) => {
                                          setEditItemData({
                                            ...editItemData,
                                            curriculumId: e.target.value,
                                            subjectName: "",
                                            topicName: "",
                                          });
                                        }}
                                        title="Select curriculum"
                                        className="w-full bg-zinc-900/50 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                      >
                                        <option value="">
                                          Select Curriculum...
                                        </option>
                                        {availableCurricula.map((c) => (
                                          <option key={c.$id} value={c.$id}>
                                            {c.name}
                                          </option>
                                        ))}
                                      </select>

                                      {getEditSubjects().length > 0 && (
                                        <select
                                          value={editItemData.subjectName}
                                          onChange={(e) => {
                                            setEditItemData({
                                              ...editItemData,
                                              subjectName: e.target.value,
                                              topicName: "",
                                            });
                                          }}
                                          title="Select subject"
                                          className="w-full bg-zinc-900/50 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                        >
                                          <option value="">
                                            Select Subject (optional)...
                                          </option>
                                          {getEditSubjects().map((s, i) => (
                                            <option key={i} value={s.name}>
                                              {s.name}
                                            </option>
                                          ))}
                                        </select>
                                      )}

                                      {getEditTopics().length > 0 && (
                                        <select
                                          value={editItemData.topicName}
                                          onChange={(e) =>
                                            setEditItemData({
                                              ...editItemData,
                                              topicName: e.target.value,
                                            })
                                          }
                                          title="Select topic"
                                          className="w-full bg-zinc-900/50 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                                        >
                                          <option value="">
                                            Select Topic (optional)...
                                          </option>
                                          {getEditTopics().map((t, i) => (
                                            <option key={i} value={t}>
                                              {t}
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                    </>
                                  )}

                                  {/* Duration input for both */}
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={1}
                                      max={180}
                                      value={editItemData.duration}
                                      onChange={(e) =>
                                        setEditItemData({
                                          ...editItemData,
                                          duration: Number(e.target.value) || 1,
                                        })
                                      }
                                      title="Duration in minutes"
                                      className={clsx(
                                        "w-20 bg-zinc-900/50 border text-white px-3 py-2 rounded-lg focus:outline-none text-sm",
                                        item.isBreak
                                          ? "border-amber-500/30 focus:border-amber-500/50"
                                          : "border-zinc-700 focus:border-indigo-500/50"
                                      )}
                                    />
                                    <span className="text-xs text-zinc-500">
                                      minutes
                                    </span>
                                  </div>

                                  {/* Save/Cancel buttons */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleSaveEditItem}
                                      className={clsx(
                                        "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors",
                                        item.isBreak
                                          ? "bg-amber-600 hover:bg-amber-500 text-white"
                                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                      )}
                                    >
                                      <Save className="w-4 h-4" />
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEditItem}
                                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Normal display mode
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() =>
                                      handleToggleScheduleItemComplete(item.id)
                                    }
                                    disabled={!isCreator}
                                    className={clsx(
                                      "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                      item.completed
                                        ? "bg-green-500 border-green-500"
                                        : item.isBreak
                                        ? "border-amber-500 hover:border-amber-400"
                                        : "border-zinc-600 hover:border-zinc-400",
                                      !isCreator && "cursor-default"
                                    )}
                                  >
                                    {item.completed && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {item.isBreak ? (
                                        <Coffee className="w-3.5 h-3.5 text-amber-500" />
                                      ) : (
                                        <GraduationCap className="w-3.5 h-3.5 text-zinc-500" />
                                      )}
                                      <span
                                        className={clsx(
                                          "text-sm font-medium truncate",
                                          item.completed
                                            ? "text-zinc-500 line-through"
                                            : item.isBreak
                                            ? "text-amber-400"
                                            : "text-white"
                                        )}
                                      >
                                        {item.curriculumName}
                                      </span>
                                    </div>
                                    {item.subjectName && !item.isBreak && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <BookOpen className="w-3 h-3 text-zinc-600" />
                                        <span className="text-xs text-zinc-400 truncate">
                                          {item.subjectName}
                                          {item.topicName &&
                                            ` → ${item.topicName}`}
                                        </span>
                                      </div>
                                    )}
                                    <span
                                      className={clsx(
                                        "text-xs mt-1 block",
                                        item.isBreak
                                          ? "text-amber-500/70"
                                          : "text-zinc-500"
                                      )}
                                    >
                                      {item.duration} min
                                    </span>
                                  </div>
                                  {isCreator && !scheduleRunning && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() =>
                                          handleStartEditItem(item)
                                        }
                                        className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors"
                                        title="Edit item"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleMoveScheduleItem(index, "up")
                                        }
                                        disabled={index === 0}
                                        className={clsx(
                                          "p-1 transition-colors",
                                          index === 0
                                            ? "text-zinc-700 cursor-not-allowed"
                                            : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                        title="Move up"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleMoveScheduleItem(index, "down")
                                        }
                                        disabled={
                                          index === scheduleItems.length - 1
                                        }
                                        className={clsx(
                                          "p-1 transition-colors",
                                          index === scheduleItems.length - 1
                                            ? "text-zinc-700 cursor-not-allowed"
                                            : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                        title="Move down"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleRemoveScheduleItem(item.id)
                                        }
                                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                        title="Remove item"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    {!scheduleVisible && !isCreator && (
                      <p className="text-sm text-zinc-500 text-center py-4">
                        Schedule is hidden by the room creator
                      </p>
                    )}

                    {scheduleItems.length === 0 &&
                      (scheduleVisible || isCreator) && (
                        <p className="text-sm text-zinc-500 text-center py-4">
                          No schedule items yet
                        </p>
                      )}

                    {/* Add Schedule Item (Creator only) */}
                    {isCreator && (
                      <div className="pt-3 border-t border-zinc-800 space-y-3">
                        <p className="text-xs text-zinc-500 font-medium">
                          Add to Schedule
                        </p>

                        {/* Curriculum Select */}
                        <select
                          value={selectedCurriculumId}
                          onChange={(e) =>
                            setSelectedCurriculumId(e.target.value)
                          }
                          title="Select a curriculum"
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                        >
                          <option value="">Select Curriculum...</option>
                          {availableCurricula.map((c) => (
                            <option key={c.$id} value={c.$id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        {/* Subject Select */}
                        {parsedSubjects.length > 0 && (
                          <select
                            value={selectedSubjectName}
                            onChange={(e) => {
                              setSelectedSubjectName(e.target.value);
                              setSelectedTopicName("");
                            }}
                            title="Select a subject"
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                          >
                            <option value="">
                              Select Subject (optional)...
                            </option>
                            {parsedSubjects.map((s, i) => (
                              <option key={i} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Topic Select */}
                        {getSelectedTopics().length > 0 && (
                          <select
                            value={selectedTopicName}
                            onChange={(e) =>
                              setSelectedTopicName(e.target.value)
                            }
                            title="Select a topic"
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                          >
                            <option value="">Select Topic (optional)...</option>
                            {getSelectedTopics().map((t, i) => (
                              <option key={i} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Duration */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={180}
                            value={scheduleDuration}
                            onChange={(e) =>
                              setScheduleDuration(Number(e.target.value))
                            }
                            className="w-20 bg-zinc-900/50 border border-zinc-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500/50 text-sm"
                          />
                          <span className="text-xs text-zinc-500">minutes</span>
                        </div>

                        {/* Add Study Item Button */}
                        <button
                          onClick={handleAddScheduleItem}
                          disabled={!selectedCurriculumId || scheduleRunning}
                          className={clsx(
                            "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                            selectedCurriculumId && !scheduleRunning
                              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          )}
                        >
                          <Plus className="w-4 h-4" />
                          Add Study Item
                        </button>

                        {/* Add Break Section */}
                        <div className="pt-3 border-t border-zinc-700/50 space-y-2">
                          <p className="text-xs text-amber-500/80 font-medium flex items-center gap-1">
                            <Coffee className="w-3 h-3" />
                            Add Break
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={breakDuration}
                              onChange={(e) =>
                                setBreakDuration(Number(e.target.value))
                              }
                              className="w-20 bg-zinc-900/50 border border-amber-500/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500/50 text-sm"
                            />
                            <span className="text-xs text-zinc-500">
                              min break
                            </span>
                            <button
                              onClick={handleAddBreakItem}
                              disabled={scheduleRunning}
                              className={clsx(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                                scheduleRunning
                                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                  : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30"
                              )}
                            >
                              <Coffee className="w-4 h-4" />
                              Add Break
                            </button>
                          </div>
                        </div>

                        {/* Schedule Control Buttons */}
                        {scheduleItems.length > 0 && (
                          <div className="pt-3 border-t border-zinc-700/50 space-y-2">
                            {/* Start/Stop Schedule Button */}
                            {!scheduleRunning ? (
                              <button
                                onClick={handleStartSchedule}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors bg-green-600 hover:bg-green-500 text-white"
                              >
                                <PlayCircle className="w-4 h-4" />
                                Start Schedule
                              </button>
                            ) : (
                              <button
                                onClick={handleStopSchedule}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors bg-red-600 hover:bg-red-500 text-white"
                              >
                                <StopCircle className="w-4 h-4" />
                                Stop Schedule
                              </button>
                            )}

                            {/* Save Schedule Button */}
                            <button
                              onClick={handleSaveSchedule}
                              disabled={scheduleSaving || scheduleRunning}
                              className={clsx(
                                "w-full bg-zinc-800 border border-zinc-700 text-zinc-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                                scheduleSaving || scheduleRunning
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-zinc-700"
                              )}
                            >
                              {scheduleSaving ? "Saving..." : "Save Schedule"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Room Info */}
              <div className="card-glass p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-4">
                  Room Info
                </h3>
                <div className="space-y-3 text-xs text-zinc-500">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-medium ${
                        room.timerState === "running"
                          ? "text-green-400"
                          : room.timerState === "paused"
                          ? "text-yellow-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {room.timerState === "running"
                        ? "Active"
                        : room.timerState === "paused"
                        ? "Paused"
                        : "Idle"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span className="font-medium text-zinc-300 capitalize">
                      {room.mode.replace("-", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-medium text-zinc-300">
                      {new Date(room.$createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timer Settings Modal */}
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
        targetDuration={roomDurations[room?.mode || "pomodoro"]}
        setTargetDuration={() => {}}
        applyPreset={() => {}}
      />

      {/* Floating Chat Widget - Non-distracting study chat */}
      <div
        className={clsx(
          "fixed z-50 transition-all duration-300 ease-in-out",
          isFullScreen ? "bottom-4 right-4" : "bottom-6 right-6"
        )}
      >
        {/* Minimized State - Just a button */}
        {chatMinimized ? (
          <button
            onClick={toggleChat}
            className={clsx(
              "relative flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105",
              "bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 hover:border-zinc-600",
              unreadCount > 0 && "ring-2 ring-indigo-500/50"
            )}
          >
            <MessageCircle className="w-5 h-5 text-zinc-300" />
            <span className="text-sm font-medium text-zinc-300 hidden sm:inline">
              Chat
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-indigo-500 text-white text-xs font-bold rounded-full animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        ) : (
          /* Expanded Chat Panel */
          <div
            className={clsx(
              "flex flex-col bg-zinc-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-zinc-700/50 overflow-hidden",
              "w-[320px] sm:w-[360px] h-[400px] sm:h-[450px]"
            )}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-white">
                  Room Chat
                </span>
                <span className="text-xs text-zinc-500">
                  ({displayUsers.length} online)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setChatMuted(!chatMuted)}
                  className={clsx(
                    "p-1.5 rounded-lg transition-colors",
                    chatMuted
                      ? "bg-red-500/20 text-red-400"
                      : "hover:bg-zinc-700 text-zinc-400"
                  )}
                  title={
                    chatMuted ? "Unmute notifications" : "Mute notifications"
                  }
                >
                  <BellOff className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors"
                  title="Minimize chat"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <MessageCircle className="w-10 h-10 text-zinc-600 mb-3" />
                  <p className="text-sm text-zinc-500">No messages yet</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Start a conversation with your study group
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwn = msg.userId === user?.$id;
                  return (
                    <div
                      key={msg.id}
                      className={clsx(
                        "flex flex-col max-w-[85%]",
                        isOwn ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      {!isOwn && (
                        <span className="text-xs text-zinc-500 mb-0.5 px-1">
                          {msg.username}
                        </span>
                      )}
                      <div
                        className={clsx(
                          "px-3 py-2 rounded-2xl text-sm break-words",
                          isOwn
                            ? "bg-indigo-600 text-white rounded-br-md"
                            : "bg-zinc-800 text-zinc-200 rounded-bl-md"
                        )}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-zinc-600 mt-0.5 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Study Focus Reminder */}
            {room?.timerState === "running" && !chatMuted && (
              <div className="px-3 py-1.5 bg-amber-500/10 border-t border-amber-500/20">
                <p className="text-xs text-amber-400/80 text-center">
                  📚 Focus session active - minimize distractions
                </p>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-3 border-t border-zinc-700/50 bg-zinc-800/30">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Type a message..."
                  maxLength={500}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  title="Send message"
                  className={clsx(
                    "p-2 rounded-lg transition-all",
                    chatInput.trim()
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

import ProtectedRoute from "@/components/ProtectedRoute";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <ProtectedRoute>
      <CloudflareWebSocketProvider roomId={roomId}>
        <RoomContent />
      </CloudflareWebSocketProvider>
    </ProtectedRoute>
  );
}
