"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { client, databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";

interface RealtimeContextType {
  activeLearners: number;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined
);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [activeLearners, setActiveLearners] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchActiveSessions = async () => {
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          [Query.equal("status", "active")]
        );
        if (isMounted) {
          setActiveLearners(response.total);
        }
      } catch (error) {
        console.error("Failed to fetch active sessions:", error);
      }
    };

    fetchActiveSessions();

    const unsubscribe = client.subscribe(
      `databases.${DB_ID}.collections.${COLLECTIONS.STUDY_SESSIONS}.documents`,
      (response) => {
        // For simplicity and accuracy, we'll re-fetch the count on any change
        // to the study sessions collection. This ensures we handle all edge cases.
        fetchActiveSessions();
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ activeLearners }}>
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
