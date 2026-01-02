export interface Env {
  STUDY_ROOM: DurableObjectNamespace;
}

type BanRecord =
  | { type: "permanent" }
  | { type: "temporary"; untilMs: number };

export class StudyRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;
  socketToUser: Map<WebSocket, { userId: string; username: string }>;
  userConnections: Map<string, { username: string; count: number }>;
  bans: Map<string, BanRecord>;
  bansLoaded: boolean;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.sessions = new Set();
    this.socketToUser = new Map();
    this.userConnections = new Map();
    this.bans = new Map();
    this.bansLoaded = false;
  }

  async ensureBansLoaded() {
    if (this.bansLoaded) return;
    const stored = (await this.state.storage.get<Record<string, BanRecord>>(
      "bans"
    )) as Record<string, BanRecord> | undefined;
    if (stored && typeof stored === "object") {
      for (const [userId, record] of Object.entries(stored)) {
        if (!userId) continue;
        if (record?.type === "permanent") {
          this.bans.set(userId, { type: "permanent" });
        } else if (
          record?.type === "temporary" &&
          typeof (record as any).untilMs === "number"
        ) {
          this.bans.set(userId, {
            type: "temporary",
            untilMs: (record as any).untilMs,
          });
        }
      }
    }
    this.bansLoaded = true;
  }

  async persistBans() {
    const obj: Record<string, BanRecord> = {};
    for (const [userId, record] of this.bans.entries()) {
      obj[userId] = record;
    }
    await this.state.storage.put("bans", obj);
  }

  getActiveBan(userId: string): BanRecord | null {
    const record = this.bans.get(userId);
    if (!record) return null;
    if (record.type === "permanent") return record;
    if (record.type === "temporary") {
      if (Date.now() < record.untilMs) return record;
      // Expired: cleanup
      this.bans.delete(userId);
      return null;
    }
    return null;
  }

  forceDisconnectUser(
    targetUserId: string,
    opts: { code: number; reason: string; notify?: any }
  ) {
    // Close all sockets associated with the user
    for (const [socket, meta] of this.socketToUser.entries()) {
      if (meta.userId !== targetUserId) continue;
      try {
        if (opts.notify) {
          socket.send(
            JSON.stringify({
              type: "admin-action",
              userId: "server",
              username: "server",
              data: opts.notify,
              timestamp: new Date().toISOString(),
            })
          );
        }
      } catch {
        // ignore
      }
      try {
        socket.close(opts.code, opts.reason);
      } catch {
        try {
          socket.close();
        } catch {
          // ignore
        }
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  handleSession(webSocket: WebSocket) {
    webSocket.accept();
    this.sessions.add(webSocket);

    webSocket.addEventListener("message", async (msg) => {
      try {
        await this.ensureBansLoaded();
        const raw = msg.data;

        if (typeof raw === "string") {
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            // If it's not JSON, just broadcast it
            this.broadcast(raw, webSocket);
            return;
          }

          // Presence handling
          if (parsed?.type === "presence" && parsed?.data?.status === "joined") {
            const userId = String(parsed.userId || "");
            const username = String(parsed.username || "Anonymous");

            if (userId) {
              const activeBan = this.getActiveBan(userId);
              if (activeBan) {
                const untilMs =
                  activeBan.type === "temporary" ? activeBan.untilMs : undefined;
                try {
                  webSocket.send(
                    JSON.stringify({
                      type: "admin-action",
                      userId: "server",
                      username: "server",
                      data: {
                        action: "banned",
                        targetUserId: userId,
                        untilMs,
                      },
                      timestamp: new Date().toISOString(),
                    })
                  );
                } catch {
                  // ignore
                }
                try {
                  webSocket.close(4003, "banned");
                } catch {
                  // ignore
                }
                return;
              }

              this.socketToUser.set(webSocket, { userId, username });

              const existing = this.userConnections.get(userId);
              if (existing) {
                existing.count += 1;
                existing.username = username;
              } else {
                this.userConnections.set(userId, { username, count: 1 });

                // Broadcast join to others (only on first connection)
                this.broadcast(
                  JSON.stringify({
                    type: "presence-update",
                    userId,
                    username,
                    data: { status: "joined", user: { userId, username } },
                    timestamp: new Date().toISOString(),
                  }),
                  webSocket
                );
              }

              // Send roster to the newly joined socket
              const users = Array.from(this.userConnections.entries()).map(
                ([id, info]) => ({ userId: id, username: info.username })
              );

              try {
                webSocket.send(
                  JSON.stringify({
                    type: "presence-roster",
                    userId: "server",
                    username: "server",
                    data: { users },
                    timestamp: new Date().toISOString(),
                  })
                );
              } catch {
                // ignore
              }
              return;
            }
          }

          // Moderation handling (kick/ban)
          if (parsed?.type === "admin-action" && parsed?.data) {
            const action = String(parsed.data.action || "");
            const targetUserId = String(parsed.data.targetUserId || "");

            if (!targetUserId) return;

            if (action === "kick") {
              this.forceDisconnectUser(targetUserId, {
                code: 4001,
                reason: "kicked",
                notify: { action: "kicked", targetUserId },
              });

              // Also adjust presence maps to ensure roster updates
              const existing = this.userConnections.get(targetUserId);
              if (existing) {
                this.userConnections.delete(targetUserId);
                this.broadcast(
                  JSON.stringify({
                    type: "presence-update",
                    userId: targetUserId,
                    username: existing.username,
                    data: {
                      status: "left",
                      user: { userId: targetUserId, username: existing.username },
                    },
                    timestamp: new Date().toISOString(),
                  }),
                  webSocket
                );
              }
              return;
            }

            if (action === "ban") {
              const permanent = Boolean(parsed.data.permanent);
              const durationMsRaw = parsed.data.durationMs;
              const durationMs =
                typeof durationMsRaw === "number" && Number.isFinite(durationMsRaw)
                  ? Math.max(0, Math.floor(durationMsRaw))
                  : 0;

              if (permanent) {
                this.bans.set(targetUserId, { type: "permanent" });
              } else {
                const untilMs = Date.now() + durationMs;
                this.bans.set(targetUserId, { type: "temporary", untilMs });
              }
              await this.persistBans();

              const record = this.bans.get(targetUserId);
              const untilMs =
                record?.type === "temporary" ? record.untilMs : undefined;

              this.forceDisconnectUser(targetUserId, {
                code: 4003,
                reason: "banned",
                notify: { action: "banned", targetUserId, untilMs },
              });

              // Also adjust presence maps to ensure roster updates
              const existing = this.userConnections.get(targetUserId);
              if (existing) {
                this.userConnections.delete(targetUserId);
                this.broadcast(
                  JSON.stringify({
                    type: "presence-update",
                    userId: targetUserId,
                    username: existing.username,
                    data: {
                      status: "left",
                      user: { userId: targetUserId, username: existing.username },
                    },
                    timestamp: new Date().toISOString(),
                  }),
                  webSocket
                );
              }
              return;
            }

            // Unknown admin-action: just broadcast
            this.broadcast(raw, webSocket);
            return;
          }

          // Default: broadcast JSON message
          this.broadcast(raw, webSocket);
          return;
        }

        // Non-string payload: broadcast as-is
        this.broadcast(raw, webSocket);
      } catch (err) {
        // Handle error
      }
    });

    webSocket.addEventListener("close", () => {
      this.sessions.delete(webSocket);

      const meta = this.socketToUser.get(webSocket);
      this.socketToUser.delete(webSocket);

      if (!meta) return;

      const existing = this.userConnections.get(meta.userId);
      if (!existing) return;

      existing.count -= 1;
      if (existing.count <= 0) {
        this.userConnections.delete(meta.userId);
        // Broadcast leave when last connection closes
        this.broadcast(
          JSON.stringify({
            type: "presence-update",
            userId: meta.userId,
            username: meta.username,
            data: { status: "left", user: { userId: meta.userId, username: meta.username } },
            timestamp: new Date().toISOString(),
          }),
          webSocket
        );
      }
    });
  }

  broadcast(message: string | ArrayBuffer, sender: WebSocket) {
    for (const session of this.sessions) {
      if (session !== sender) {
        try {
          session.send(message);
        } catch (err) {
          this.sessions.delete(session);
        }
      }
    }
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    // Route requests to the Durable Object
    // Example: /api/room/:roomId
    const match = url.pathname.match(/^\/api\/room\/([^\/]+)/);
    
    if (match) {
      const roomId = match[1];
      const id = env.STUDY_ROOM.idFromName(roomId);
      const obj = env.STUDY_ROOM.get(id);

      return obj.fetch(request);
    }

    // Handle root path to show worker is running
    if (url.pathname === "/") {
      return new Response("StudyRoom Worker is running!", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  },
};
