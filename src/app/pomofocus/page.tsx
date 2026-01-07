"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function PomoFocusPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            PomoFocus - Pomodoro Timer & Focus App
          </h1>
          <p className="text-zinc-400">
            Alternative to PomoFocus with enhanced features. Track your focus
            sessions, customize your timer, and boost productivity with our free
            Pomodoro app.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
