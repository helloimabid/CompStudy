import { Metadata } from "next";
import StopWatchClient from "./Client";

export const metadata: Metadata = {
  title: "Stop Watch Online - Free Study Time Tracker",
  description: "Simple free online stop watch for tracking study time and work sessions. Accurate time tracking for students. Track study hours with easy start, stop, and reset controls.",
  keywords: [
    "stop watch",
    "online stop watch",
    "study time tracker",
    "free online",
    "study time",
    "study hours",
    "track study hours",
    "free study tools",
  ],
  openGraph: {
    title: "Free Online Stop Watch - Study Time Tracker",
    description: "Simple stop watch for tracking study sessions and work time. Free for students.",
  },
  alternates: {
    canonical: "https://compstudy.tech/stop-watch",
  },
};

export default function StopWatchPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Free Online Stop Watch — Study Time Tracker
          </h1>
          <p className="text-zinc-400">
            Free online stop watch for tracking study time and work sessions.
            Perfect for students — track study hours with easy start, stop,
            and reset controls.
          </p>
        </div>
        <StopWatchClient />
      </div>
    </div>
  );
}
