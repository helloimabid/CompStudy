"use client";

import { ArrowLeft, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import StudyTimer from "@/components/StudyTimer";
import { useEffect, useState } from "react";
import { client, databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { AnimatePresence, motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Peer {
  $id: string;
  userId: string;
  username: string;
  subject: string;
  startTime: string;
  status: "active" | "paused" | "completed";
  profilePicture?: string;
  elapsedTime: number;
  isPublic: boolean;
}

function FocusContent() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(true);
  const [showPeersDrawer, setShowPeersDrawer] = useState(false);

  useEffect(() => {
    const fetchPeers = async () => {
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.LIVE_SESSIONS,
          [
            Query.equal("status", "active"),
            Query.orderDesc("startTime"),
            Query.limit(20),
          ]
        );

        // Filter for public sessions (handle both boolean and string types)
        const publicPeers = response.documents.filter((doc: any) => {
          return doc.isPublic === true || doc.isPublic === "true";
        });

        setPeers(publicPeers as unknown as Peer[]);
      } catch (error) {
        console.error("Failed to fetch peers:", error);
      } finally {
        setLoadingPeers(false);
      }
    };

    fetchPeers();

    // Subscribe to real-time updates
    const unsubscribe = client.subscribe(
      `databases.${DB_ID}.collections.${COLLECTIONS.LIVE_SESSIONS}.documents`,
      (response) => {
        const event = response.events[0];
        const doc = response.payload as unknown as Peer;

        const isPublic = doc.isPublic === true ;

        if (event.includes(".create") && isPublic && doc.status === "active") {
          setPeers((prev) => {
            const filtered = prev.filter((p) => p.userId !== doc.userId);
            return [doc, ...filtered];
          });
        } else if (event.includes(".update")) {
          if (doc.status === "active" && isPublic) {
            setPeers((prev) => {
              const exists = prev.find((p) => p.$id === doc.$id);
              if (exists) {
                return prev.map((p) => (p.$id === doc.$id ? doc : p));
              } else {
                return [doc, ...prev];
              }
            });
          } else {
            // Remove if no longer active or public
            setPeers((prev) => prev.filter((p) => p.$id !== doc.$id));
          }
        } else if (event.includes(".delete")) {
          setPeers((prev) => prev.filter((p) => p.$id !== doc.$id));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / 60000); // minutes
    if (diff < 60) return `${diff}m`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Header */}
      <header className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <h1 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Focus Mode
            </h1>
          </div>
        </div>
        <Link
          href="/start-studying"
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-black text-xs font-medium hover:bg-zinc-200 transition-all"
        >
          Join Study Room
          <ArrowRight width={14} />
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            <StudyTimer />
          </div>
        </div>

        {/* Right Sidebar - Live Peers (Desktop) */}
        <div className="w-64 lg:w-80 border-l border-white/5 bg-[#0a0a0a] p-4 md:p-6 hidden xl:flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Live Peers ({peers.length})
            </h3>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>

          <div className="space-y-6 overflow-y-auto flex-1 custom-scrollbar pr-2">
            {loadingPeers ? (
              <div className="text-zinc-500 text-sm text-center py-4">
                Loading peers...
              </div>
            ) : peers.length === 0 ? (
              <div className="text-zinc-500 text-sm text-center py-4">
                No one else is studying right now. Be the first!
              </div>
            ) : (
              peers.map((peer) => (
                <div key={peer.$id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {peer.profilePicture ? (
                        <img
                          src={peer.profilePicture}
                          alt={peer.username || "Student"}
                          className="w-8 h-8 rounded-full object-cover border border-indigo-500/30"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-indigo-600 text-white">
                          {(peer.username || "A").substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {peer.username || "Student"}
                        </span>
                        <span className="text-xs text-zinc-500 truncate max-w-[120px]">
                          {peer.subject || "Focusing"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatDuration(peer.startTime)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500/50"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Peers Button (Mobile/Tablet) */}
      <button
        onClick={() => setShowPeersDrawer(true)}
        className="xl:hidden fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-lg shadow-indigo-900/50 z-40 flex items-center gap-2 transition-all hover:scale-105"
      >
        <Users size={20} />
        <span className="text-sm font-medium">{peers.length}</span>
      </button>

      {/* Mobile Peers Drawer */}
      <AnimatePresence>
        {showPeersDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPeersDrawer(false)}
              className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="xl:hidden fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-[#0a0a0a] border-l border-white/5 p-6 z-50 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Users size={18} className="text-green-500" />
                  Live Peers ({peers.length})
                </h3>
                <button
                  title="peersDrawer"
                  onClick={() => setShowPeersDrawer(false)}
                  className="text-zinc-500 hover:text-white transition-colors p-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {loadingPeers ? (
                  <div className="text-zinc-500 text-sm text-center py-8">
                    Loading peers...
                  </div>
                ) : peers.length === 0 ? (
                  <div className="text-zinc-500 text-sm text-center py-8">
                    No one else is studying right now. Be the first!
                  </div>
                ) : (
                  peers.map((peer) => (
                    <div
                      key={peer.$id}
                      className="bg-zinc-900/30 border border-white/5 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {peer.profilePicture ? (
                            <img
                              src={peer.profilePicture}
                              alt={peer.username || "Student"}
                              className="w-10 h-10 rounded-full object-cover border border-indigo-500/30"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-indigo-600 text-white">
                              {(peer.username || "A")
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">
                              {peer.username || "Student"}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {peer.subject || "Focusing"}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">
                          {formatDuration(peer.startTime)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function FocusPage() {
  return (
    <ProtectedRoute>
      <FocusContent />
    </ProtectedRoute>
  );
}
