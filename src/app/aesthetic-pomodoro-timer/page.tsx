"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function AestheticPomodoroTimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Aesthetic Pomodoro Timer - Beautiful Focus Timer
          </h1>
          <p className="text-zinc-400">
            Stunning aesthetic Pomodoro timer with customizable themes and
            styles. Make your focus sessions visually pleasing and productive.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
