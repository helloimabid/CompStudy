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
    | "user-action"
    | "admin-action";
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
