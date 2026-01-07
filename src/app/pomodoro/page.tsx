"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function PomodoroPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Pomodoro - Master the Pomodoro Technique
          </h1>
          <p className="text-zinc-400">
            Work in focused 25-minute intervals followed by short breaks. The
            Pomodoro Technique helps you maintain concentration and avoid
            burnout.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
