"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function TimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Online Timer - Free Countdown & Study Timer
          </h1>
          <p className="text-zinc-400">
            Versatile online timer for all your needs. Use as countdown timer,
            stopwatch, or focus timer. Fully customizable and easy to use.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
