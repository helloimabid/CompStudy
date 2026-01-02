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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { client, databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { ID, Permission, Query, Role } from "appwrite";
import GridTimerDisplay from "@/components/GridTimerDisplay";
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
  $createdAt: string;
  $updatedAt: string;
}

type PresenceUser = { userId: string; username: string };

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
  const [roomLoading, setRoomLoading] = useState(true);
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(0);
  const lastMessageIndexRef = useRef(0);
  const serverOffsetMsRef = useRef(0);
  const roomDurations = getRoomDurations(room);

  const [configDraft, setConfigDraft] = useState<{
    name: string;
    subject: string;
    isStrict: boolean;
    pomodoroMin: number;
    shortBreakMin: number;
    longBreakMin: number;
  } | null>(null);
  const [configSaving, setConfigSaving] = useState(false);

  const requestedRoomConfigRef = useRef<{
    name?: string;
    subject?: string;
    isStrict?: boolean;
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

    requestedRoomConfigRef.current = {
      name,
      subject,
      isStrict: strict === "1" ? true : strict === "0" ? false : undefined,
      durations: {
        pomodoro: pMin * 60,
        "short-break": sMin * 60,
        "long-break": lMin * 60,
      },
    };
  }

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
          setProfile(profiles.documents[0] as any);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

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
                // Allow the room creator to remove participants
                Permission.delete(Role.user(currentRoom.creatorId)),
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
          const requestedIsStrict = requested?.isStrict ?? false;

          const newRoom = await databases.createDocument(
            DB_ID,
            COLLECTIONS.ROOMS,
            ID.unique(),
            {
              name: requestedName,
              subject: requestedSubject,
              activeUsers: 1,
              isStrict: requestedIsStrict,
              roomId: roomId,
              creatorId: user.$id,
              participants: JSON.stringify({ durations: requestedDurations }),
              timerState: "idle",
              timeRemaining: requestedDurations.pomodoro,
              mode: "pomodoro",
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
    participants.map((p) => ({ userId: p.userId, username: p.username }))
  );
  const displayUsers: Array<{ userId: string; username: string }> =
    isConnected && presenceUsers.length > 0
      ? dedupeUsers(presenceUsers)
      : fallbackUsers;

  return (
    <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
              Study Room
            </h1>
            <div className="flex items-center gap-2">
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
            {isCreator && (
              <button
                onClick={handleDeleteRoom}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                title="Delete Room"
              >
                <LogOut className="w-4 h-4" />
                Delete Room
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Leave Room
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  room.mode === "pomodoro"
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                } ${!isCreator ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Pomodoro
              </button>
              <button
                onClick={() => handleModeChange("short-break")}
                disabled={!isCreator}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  room.mode === "short-break"
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                } ${!isCreator ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Short Break
              </button>
              <button
                onClick={() => handleModeChange("long-break")}
                disabled={!isCreator}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  room.mode === "long-break"
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                } ${!isCreator ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Long Break
              </button>
            </div>

            {/* Timer Display */}
            <div className="card-glass p-8 md:p-12">
              <div className="flex flex-col items-center">
                <div className="mb-8 md:mb-12">
                  <GridTimerDisplay time={formatTime(localTimeRemaining)} />
                </div>

                {/* Timer Controls */}
                <div className="flex gap-4">
                  <button
                    onClick={handlePlayPause}
                    disabled={!isCreator}
                    className={`flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-lg font-medium text-sm md:text-base transition-all ${
                      room.timerState === "running"
                        ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                        : "bg-indigo-500 hover:bg-indigo-400 text-white"
                    } ${!isCreator ? "opacity-50 cursor-not-allowed" : ""}`}
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
                    className={`flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm md:text-base transition-all ${
                      !isCreator ? "opacity-50 cursor-not-allowed" : ""
                    }`}
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
                <Clock className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-medium text-zinc-300">
                  Session Progress
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
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
                <Users className="w-5 h-5 text-indigo-400" />
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
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-medium">
                      {participant.username[0].toUpperCase()}
                    </div>
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
                            handleModerateUser(participant.userId, "kick-temp")
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
                          prev ? { ...prev, isStrict: e.target.checked } : prev
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
                    If the timer is running/paused, durations apply next reset.
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
    </main>
  );
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <CloudflareWebSocketProvider roomId={roomId}>
      <RoomContent />
    </CloudflareWebSocketProvider>
  );
}
