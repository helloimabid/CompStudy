"use client";

import { useRealtime } from "@/context/RealtimeContext";

export default function LiveBadge() {
  const { activeLearners } = useRealtime();

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 mb-8 backdrop-blur-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
      </span>
      <span className="text-xs font-medium text-indigo-300">
        {activeLearners.toLocaleString()} students focusing now
      </span>
    </div>
  );
}
