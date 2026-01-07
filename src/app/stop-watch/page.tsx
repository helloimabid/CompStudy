"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function StopWatchPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Stop Watch - Free Online Timer
          </h1>
          <p className="text-zinc-400">
            Professional stop watch for precise timing. Perfect for sports,
            studying, cooking, and more. Start timing instantly.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
