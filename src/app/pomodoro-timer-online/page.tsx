import { Metadata } from "next";
import PomodoroTimerOnlineClient from "./Client";

export const metadata: Metadata = {
  title: "Online Pomodoro Timer - Free Study App & Focus Timer",
  description: "Best free online Pomodoro timer for studying. Study app with focus timer, study rooms, and progress tracking. Study together online with students worldwide. No signup required.",
  keywords: [
    "pomodoro timer online",
    "online pomodoro",
    "study timer online",
    "focus timer online",
    "free pomodoro timer",
    "online study",
    "free online",
    "study app",
    "study focus",
    "study together online",
    "online learning",
  ],
  openGraph: {
    title: "Free Online Pomodoro Timer - Study App for Students",
    description: "Best online Pomodoro timer with study rooms and focus tracking. Free study app for students.",
  },
  alternates: {
    canonical: "https://compstudy.tech/pomodoro-timer-online",
  },
};

export default function PomodoroTimerOnlinePage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Online Pomodoro Timer — Free Study App for Students
          </h1>
          <p className="text-zinc-400">
            Complete free online Pomodoro timer that works in your browser. No
            downloads, no sign-up. Start your online study session in seconds
            and study together with students worldwide.
          </p>
        </div>
        <PomodoroTimerOnlineClient />
      </div>
    </div>
  );
}
