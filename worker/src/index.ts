export interface Env {
  STUDY_ROOM: DurableObjectNamespace;
}

export class StudyRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;
  socketToUser: Map<WebSocket, { userId: string; username: string }>;
  userConnections: Map<string, { username: string; count: number }>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.sessions = new Set();
    this.socketToUser = new Map();
    this.userConnections = new Map();
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
