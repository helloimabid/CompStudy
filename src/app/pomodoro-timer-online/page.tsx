"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function PomodoroTimerOnlinePage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Pomodoro Timer Online - Free Web Timer
          </h1>
          <p className="text-zinc-400">
            Complete online Pomodoro timer that works in your browser. No
            downloads, no sign-up. Start your focus session in seconds.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
