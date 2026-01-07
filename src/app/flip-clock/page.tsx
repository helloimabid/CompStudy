"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function FlipClockPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Flip Clock Timer - Digital Study Timer
          </h1>
          <p className="text-zinc-400">
            Beautiful flip clock style timer with multiple display modes.
            Perfect for focus sessions and time tracking.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
