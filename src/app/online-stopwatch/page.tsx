import { Metadata } from "next";
import OnlineStopwatchClient from "./Client";

export const metadata: Metadata = {
  title: "Online Stopwatch - Free Study & Time Tracker",
  description: "Clean and simple free online stopwatch for students. Track study time, study sessions, and study hours. No signup required. Best free online study tool.",
  keywords: [
    "online stopwatch",
    "free online stopwatch",
    "study time tracker",
    "free online",
    "study time",
    "study hours",
    "free study tools",
    "students free",
    "online study tools",
  ],
  openGraph: {
    title: "Free Online Stopwatch - Study Time Tracker",
    description: "Clean and simple online stopwatch for tracking study sessions. Free with no signup.",
  },
  alternates: {
    canonical: "https://compstudy.tech/online-stopwatch",
  },
};

export default function OnlineStopwatchPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Online Stopwatch — Free Study & Time Tracker
          </h1>
          <p className="text-zinc-400">
            Full-featured free online stopwatch for students. Track study time
            and study sessions with no installation needed. The best free
            online study tool.
          </p>
        </div>
        <OnlineStopwatchClient />
      </div>
    </div>
  );
}
