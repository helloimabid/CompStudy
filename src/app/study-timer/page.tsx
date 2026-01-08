"use client";

import { Metadata } from "next";
import StudyTimer from "@/components/StudyTimer";

export default function StudyTimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Study Timer - Focus Timer for Students
          </h1>
          <p className="text-zinc-400">
            Dedicated study timer designed for students. Track your study
            sessions, manage breaks, and improve your focus with proven time
            management techniques.
          </p>
        </div>
        <StudyTimer />
      </div>
    </div>
  );
}
