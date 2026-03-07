import { Metadata } from "next";
import StopwatchClient from "./Client";

export const metadata: Metadata = {
  title: "Online Stopwatch - Free Study Time Tracker for Students",
  description: "Free online stopwatch for tracking study sessions and study hours. Simple time tracker with lap times and session history. Best free study tool for students and online learning.",
  keywords: [
    "online stopwatch",
    "stopwatch",
    "study stopwatch",
    "time tracker",
    "free stopwatch online",
    "study tracker",
    "study hours",
    "study time",
    "track study hours",
    "free online",
    "free study tools",
  ],
  openGraph: {
    title: "Free Online Stopwatch - Study Time Tracker",
    description: "Free online stopwatch for tracking study sessions. Simple, accurate time tracking.",
  },
  alternates: {
    canonical: "https://compstudy.tech/stopwatch",
  },
};

export default function StopwatchPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Free Online Stopwatch — Study Time Tracker
          </h1>
          <p className="text-zinc-400">
            Simple, accurate free online stopwatch for tracking study sessions
            and study hours. Perfect study tracker for students, no sign-up
            required.
          </p>
        </div>
        <StopwatchClient />
      </div>
    </div>
  );
}
