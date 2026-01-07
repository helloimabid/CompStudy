"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function TwentyFiveMinuteTimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            25 Minute Timer - Perfect Pomodoro Focus Session
          </h1>
          <p className="text-zinc-400">
            Set your timer for 25 minutes and focus. The ideal duration for deep
            work based on the Pomodoro Technique. Stay productive and focused.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
