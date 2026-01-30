"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { client, databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query, ID, Permission, Role } from "appwrite";
import { useAuth } from "@/context/AuthContext";

interface RealtimeContextType {
  activeLearners: number;
  activeVisitors: number;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined,
);

// Generate a unique visitor ID and store in sessionStorage
const getVisitorId = (): string => {
  if (typeof window === "undefined") return "";

  let visitorId = sessionStorage.getItem("compstudy_visitor_id");
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("compstudy_visitor_id", visitorId);
  }
  return visitorId;
};

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [activeLearners, setActiveLearners] = useState(0);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [visitorDocId, setVisitorDocId] = useState<string | null>(null);

  // Get the current user from AuthContext
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    let heartbeatInterval: NodeJS.Timeout;
    let cleanupInterval: NodeJS.Timeout;

    const fetchActiveSessions = async () => {
      try {
        // Get active study sessions
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          [Query.equal("status", "active")],
        );

        if (isMounted) {
          setActiveLearners(response.total);
        }
      } catch (error) {
        console.error("Failed to fetch active sessions:", error);
      }
    };

    const fetchActiveVisitors = async () => {
      try {
        // Get visitors with heartbeat in the last 2 minutes
        const twoMinutesAgo = new Date(
          Date.now() - 2 * 60 * 1000,
        ).toISOString();
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.VISITORS,
          [Query.greaterThan("lastHeartbeat", twoMinutesAgo)],
        );

        if (isMounted) {
          setActiveVisitors(Math.max(response.total, 1)); // At least 1 (self)
        }
      } catch (error) {
        // Collection might not exist yet
        console.error("Failed to fetch active visitors:", error);
        if (isMounted) {
          setActiveVisitors(1); // Show at least self
        }
      }
    };

    const registerVisitor = async () => {
      const visitorId = getVisitorId();
      if (!visitorId) return;

      try {
        // Check if visitor already exists
        const existing = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.VISITORS,
          [Query.equal("visitorId", visitorId), Query.limit(1)],
        );

        if (existing.documents.length > 0) {
          // Update existing visitor
          const docId = existing.documents[0].$id;
          await databases.updateDocument(DB_ID, COLLECTIONS.VISITORS, docId, {
            lastHeartbeat: new Date().toISOString(),
            page:
              typeof window !== "undefined" ? window.location.pathname : "/",
            userId: user?.$id || null,
          });
          setVisitorDocId(docId);
        } else {
          // Create new visitor
          const doc = await databases.createDocument(
            DB_ID,
            COLLECTIONS.VISITORS,
            ID.unique(),
            {
              visitorId,
              lastHeartbeat: new Date().toISOString(),
              page:
                typeof window !== "undefined" ? window.location.pathname : "/",
              userId: user?.$id || null,
            },
            [
              Permission.read(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any()),
            ],
          );
          setVisitorDocId(doc.$id);
        }
      } catch (error) {
        console.error("Failed to register visitor:", error);
      }
    };

    const sendHeartbeat = async () => {
      const visitorId = getVisitorId();
      if (!visitorId) return;

      try {
        const existing = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.VISITORS,
          [Query.equal("visitorId", visitorId), Query.limit(1)],
        );

        if (existing.documents.length > 0) {
          await databases.updateDocument(
            DB_ID,
            COLLECTIONS.VISITORS,
            existing.documents[0].$id,
            {
              lastHeartbeat: new Date().toISOString(),
              page:
                typeof window !== "undefined" ? window.location.pathname : "/",
              userId: user?.$id || null,
            },
          );
        } else {
          await registerVisitor();
        }
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };

    const cleanupStaleVisitors = async () => {
      try {
        // Delete visitors with heartbeat older than 3 minutes
        const threeMinutesAgo = new Date(
          Date.now() - 3 * 60 * 1000,
        ).toISOString();
        const stale = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.VISITORS,
          [Query.lessThan("lastHeartbeat", threeMinutesAgo), Query.limit(50)],
        );

        for (const doc of stale.documents) {
          await databases.deleteDocument(DB_ID, COLLECTIONS.VISITORS, doc.$id);
        }
      } catch (error) {
        // Silently fail - cleanup is best effort
      }
    };

    // Initialize
    setIsConnected(true);
    registerVisitor();
    fetchActiveSessions();
    fetchActiveVisitors();

    // Subscribe to realtime updates for study sessions
    const unsubscribeSessions = client.subscribe(
      `databases.${DB_ID}.collections.${COLLECTIONS.STUDY_SESSIONS}.documents`,
      () => {
        fetchActiveSessions();
      },
    );

    // Subscribe to realtime updates for visitors
    const unsubscribeVisitors = client.subscribe(
      `databases.${DB_ID}.collections.${COLLECTIONS.VISITORS}.documents`,
      () => {
        fetchActiveVisitors();
      },
    );

    // Send heartbeat every 30 seconds
    heartbeatInterval = setInterval(() => {
      sendHeartbeat();
      fetchActiveVisitors();
      fetchActiveSessions();
    }, 30000);

    // Cleanup stale visitors every 60 seconds
    cleanupInterval = setInterval(cleanupStaleVisitors, 60000);

    // Cleanup on unmount
    return () => {
      isMounted = false;
      setIsConnected(false);
      clearInterval(heartbeatInterval);
      clearInterval(cleanupInterval);
      unsubscribeSessions();
      unsubscribeVisitors();

      // Remove self from visitors on page unload
      const visitorId = getVisitorId();
      if (visitorId) {
        databases
          .listDocuments(DB_ID, COLLECTIONS.VISITORS, [
            Query.equal("visitorId", visitorId),
            Query.limit(1),
          ])
          .then((res) => {
            if (res.documents.length > 0) {
              databases
                .deleteDocument(
                  DB_ID,
                  COLLECTIONS.VISITORS,
                  res.documents[0].$id,
                )
                .catch(() => {});
            }
          })
          .catch(() => {});
      }
    };
  }, []); // Only run on mount/unmount

  // Separate effect to update userId when user logs in/out
  useEffect(() => {
    const updateVisitorUserId = async () => {
      const visitorId = getVisitorId();
      if (!visitorId) return;

      // Small delay to ensure visitor document is created first
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const existing = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.VISITORS,
          [Query.equal("visitorId", visitorId), Query.limit(1)],
        );

        if (existing.documents.length > 0) {
          const currentUserId = existing.documents[0].userId;
          const newUserId = user?.$id || null;

          // Only update if userId actually changed
          if (currentUserId !== newUserId) {
            await databases.updateDocument(
              DB_ID,
              COLLECTIONS.VISITORS,
              existing.documents[0].$id,
              { userId: newUserId },
            );
          }
        }
      } catch {
        // Silently fail - visitor userId update is best effort
      }
    };

    // Run the update
    updateVisitorUserId();
  }, [user?.$id]); // Run when user changes

  return (
    <RealtimeContext.Provider
      value={{ activeLearners, activeVisitors, isConnected }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
