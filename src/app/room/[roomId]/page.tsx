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
  $createdAt: string;
  $updatedAt: string;
}

type PresenceUser = { userId: string; username: string; profilePicture?: string };

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
  const [participantProfiles, setParticipantProfiles] = useState<Map<string, { username: string; profilePicture?: string }>>(new Map());
  const [roomLoading, setRoomLoading] = useState(true);
  const [profile, setProfile] = useState<{ username: string; profilePicture?: string } | null>(null);
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

  const [configDraft, setConfigDraft] = useState<{
    name: string;
    subject: string;
    isStrict: boolean;
    pomodoroMin: number;
    shortBreakMin: number;
    longBreakMin: number;
  } | null>(null);
  const [configSaving, setConfigSaving] = useState(false);

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
        
        const profileMap = new Map<string, { username: string; profilePicture?: string }>();
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
        if (status === "joined" && room && user && room.creatorId === user.$id) {
          const currentTime = computeDerivedRemaining(room, serverOffsetMsRef.current);
          sendMessage("timer-sync", {
            action: room.timerState === "running" ? "play" : room.timerState === "paused" ? "pause" : "reset",
            timeRemaining: currentTime,
            mode: room.mode,
          });
        }
      }

      // Handle timer sync request from participants
      if (message.type === "timer-sync-request" && room && user && room.creatorId === user.$id) {
        const currentTime = computeDerivedRemaining(room, serverOffsetMsRef.current);
        sendMessage("timer-sync", {
          action: room.timerState === "running" ? "play" : room.timerState === "paused" ? "pause" : "reset",
          timeRemaining: currentTime,
          mode: room.mode,
        });
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
  const displayUsers: Array<{ userId: string; username: string; profilePicture?: string }> =
    isConnected && presenceUsers.length > 0
      ? dedupeUsers(presenceUsers.map(pu => ({
          ...pu,
          profilePicture: participantProfiles.get(pu.userId)?.profilePicture,
        })))
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
                        Subject
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
