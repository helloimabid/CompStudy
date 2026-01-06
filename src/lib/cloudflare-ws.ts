// Cloudflare WebSocket configuration
export const CLOUDFLARE_WS_URL = "wss://comp-study-worker.helloimabid.workers.dev";

export function getWebSocketUrl(roomId: string): string {
  return `${CLOUDFLARE_WS_URL}/api/room/${roomId}`;
}

export interface WebSocketMessage {
  type:
    | "cursor"
    | "presence"
    | "presence-roster"
    | "presence-update"
    | "chat"
    | "timer-sync"
    | "timer-sync-request"
    | "user-action"
    | "admin-action"
    | "session-start"
    | "session-update"
    | "session-end"
    | "session-list-request"
    | "session-list";
  userId: string;
  username: string;
  data: any;
  timestamp: string;
}

export function createWebSocketMessage(
  type: WebSocketMessage["type"],
  userId: string,
  username: string,
  data: any
): string {
  const message: WebSocketMessage = {
    type,
    userId,
    username,
    data,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(message);
}

// Session WebSocket Manager for global session tracking
export class SessionWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private roomId: string;

  constructor(roomId: string = "global-sessions") {
    this.roomId = roomId;
  }

  connect() {
    if (this.ws) return;

    try {
      this.ws = new WebSocket(getWebSocketUrl(this.roomId));

      this.ws.onopen = () => {
        console.log("Session WebSocket connected");
      };

      this.ws.onerror = (error) => {
        console.error("Session WebSocket error:", error);
      };

      this.ws.onclose = () => {
        console.log("Session WebSocket closed");
        this.ws = null;

        if (this.shouldReconnect) {
          this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
        }
      };
    } catch (error) {
      console.error("Failed to connect session WebSocket:", error);
    }
  }

  sendSessionStart(
    userId: string,
    username: string,
    sessionData: {
      subject: string;
      goal: string;
      startTime: string;
      duration?: number;
      isPublic: boolean;
      sessionType: "focus" | "break";
      profilePicture?: string;
      streak?: number;
      totalHours?: number;
    }
  ) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        createWebSocketMessage("session-start", userId, username, {
          ...sessionData,
        })
      );
    }
  }

  sendSessionUpdate(
    userId: string,
    username: string,
    updates: {
      status?: "active" | "paused" | "completed";
      elapsedTime?: number;
      subject?: string;
      goal?: string;
      sessionType?: "focus" | "break";
    }
  ) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        createWebSocketMessage("session-update", userId, username, updates)
      );
    }
  }

  sendSessionEnd(userId: string, username: string, elapsedTime: number) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        createWebSocketMessage("session-end", userId, username, { elapsedTime })
      );
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
