"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function StopwatchPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Free Online Stopwatch
          </h1>
          <p className="text-zinc-400">
            Simple, accurate online stopwatch for timing your study sessions,
            workouts, or any activity. No sign-up required.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
