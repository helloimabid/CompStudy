"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getWebSocketUrl, WebSocketMessage } from "@/lib/cloudflare-ws";
import { useAuth } from "./AuthContext";

interface CloudflareWebSocketContextType {
  sendMessage: (type: WebSocketMessage["type"], data: any) => void;
  isConnected: boolean;
  messages: WebSocketMessage[];
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
}

const CloudflareWebSocketContext =
  createContext<CloudflareWebSocketContextType | null>(null);

export function CloudflareWebSocketProvider({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId: string;
}) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const connectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  const connect = () => {
    if (!roomId || !user) {
      console.log("Waiting for roomId and user before connecting WebSocket");
      return;
    }

    const attemptId = ++connectAttemptRef.current;

    // Close existing connection if any
    if (wsRef.current) {
      try {
        wsRef.current.close(1000, "reconnect");
      } catch {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    try {
      setConnectionStatus("connecting");
      const ws = new WebSocket(getWebSocketUrl(roomId));

      ws.onopen = () => {
        if (attemptId !== connectAttemptRef.current) return;
        console.log("Cloudflare WebSocket connected");
        setIsConnected(true);
        setConnectionStatus("connected");

        // Send presence notification
        const presenceMessage = {
          type: "presence",
          userId: user.$id,
          username: user.name || "Anonymous",
          data: { status: "joined" },
          timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(presenceMessage));
      };

      ws.onmessage = (event) => {
        if (attemptId !== connectAttemptRef.current) return;
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setMessages((prev) => [...prev, message].slice(-100)); // Keep last 100 messages
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        if (attemptId !== connectAttemptRef.current) return;
        console.error("Cloudflare WebSocket error:", error);
        setConnectionStatus("error");
      };

      ws.onclose = (event) => {
        if (attemptId !== connectAttemptRef.current) return;
        console.log(
          "Cloudflare WebSocket disconnected",
          event.code,
          event.reason
        );
        setIsConnected(false);
        setConnectionStatus("disconnected");
        wsRef.current = null;

        // Stop reconnect loops when the server intentionally disconnects
        // for moderation (kick/ban) or similar policy reasons.
        if (event.code === 4001 || event.code === 4003) {
          shouldReconnectRef.current = false;
          return;
        }

        // Only reconnect if still mounted and user is still available
        if (!shouldReconnectRef.current) return;

        // Don't auto-reconnect for intentional close
        if (event.code === 1000) return;

        if (user) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect WebSocket...");
            connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionStatus("error");
    }
  };

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, "unmount");
        } catch {
          wsRef.current.close();
        }
      }
    };
  }, [roomId, user]);

  const sendMessage = (type: WebSocketMessage["type"], data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      const message = {
        type,
        userId: user.$id,
        username: user.name || "Anonymous",
        data,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return (
    <CloudflareWebSocketContext.Provider
      value={{ sendMessage, isConnected, messages, connectionStatus }}
    >
      {children}
    </CloudflareWebSocketContext.Provider>
  );
}

export function useCloudflareWebSocket() {
  const context = useContext(CloudflareWebSocketContext);
  if (!context) {
    throw new Error(
      "useCloudflareWebSocket must be used within CloudflareWebSocketProvider"
    );
  }
  return context;
}
