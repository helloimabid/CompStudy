"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function PomodoroTimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Pomodoro Timer - Free Focus Timer for Productivity
          </h1>
          <p className="text-zinc-400">
            Classic Pomodoro Timer with 25-minute focus sessions and 5-minute
            breaks. Boost your productivity with the proven Pomodoro Technique.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
