"use client";

import { useEffect, useState } from "react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { User, Clock, Target, BookOpen, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface StudySession {
  $id: string;
  userId: string;
  username?: string; // We might need to fetch this or store it in the session
  subject: string;
  goal: string;
  startTime: string;
  status: string;
  type: "focus" | "break";
}

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Fetch active public sessions
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.STUDY_SESSIONS,
          [
            Query.equal("status", "active"),
            Query.equal("isPublic", true),
            Query.orderDesc("startTime"),
            Query.limit(50),
          ]
        );

        // For a real app, we would need to fetch user details for each session
        // or store username in the session document.
        // For now, let's assume we might add username to the session schema or just show "Anonymous Student"
        // To make it look good, I'll fetch profiles for these users if possible, or just use a placeholder.
        // Actually, let's update the schema to store 'username' in the session for easier display.
        // But I can't easily update schema and migrate data right now without a script.
        // I'll just fetch profiles for the displayed sessions.

        const sessionDocs = response.documents as unknown as StudySession[];

        // Fetch profiles for these users to get usernames
        const userIds = [...new Set(sessionDocs.map((s) => s.userId))];
        if (userIds.length > 0) {
          const profiles = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.PROFILES,
            [Query.equal("userId", userIds)]
          );

          const userMap = new Map();
          profiles.documents.forEach((p: any) => {
            userMap.set(p.userId, p.username);
          });

          const sessionsWithNames = sessionDocs.map((s) => ({
            ...s,
            username: userMap.get(s.userId) || "Student",
          }));
          setSessions(sessionsWithNames);
        } else {
          setSessions(sessionDocs);
        }
      } catch (error) {
        console.error("Failed to fetch live sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    // Poll every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const getDuration = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000); // minutes
    return diff;
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-medium text-white mb-6 tracking-tight">
            Live <span className="text-indigo-400">Study Rooms</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            See what others are working on right now. Join the global focus
            session.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            No public sessions active right now. Be the first!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session, idx) => (
              <motion.div
                key={session.$id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 hover:border-indigo-500/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-medium">
                      {session.username?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm">
                        {session.username}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Focusing for {getDuration(session.startTime)}m
                      </div>
                    </div>
                  </div>
                  <div
                    className={clsx(
                      "px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider",
                      session.type === "break"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-indigo-500/10 text-indigo-400"
                    )}
                  >
                    {session.type || "Focus"}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                      <BookOpen size={12} />
                      Subject
                    </div>
                    <div className="text-zinc-200 text-sm font-medium">
                      {session.subject || "General Study"}
                    </div>
                  </div>
                  {session.goal && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                        <Target size={12} />
                        Goal
                      </div>
                      <div className="text-zinc-400 text-sm line-clamp-2">
                        {session.goal}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
