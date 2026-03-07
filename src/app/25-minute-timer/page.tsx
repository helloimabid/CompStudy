import { Metadata } from "next";
import TwentyFiveMinuteTimerClient from "./Client";

export const metadata: Metadata = {
  title: "25 Minute Timer - Free Pomodoro Study Timer Online",
  description: "Free 25 minute Pomodoro timer for studying online. Perfect study focus sessions with automatic break reminders, study tracking, and study rooms. Best free study app.",
  keywords: [
    "25 minute timer",
    "25 min timer",
    "pomodoro 25 minutes",
    "study timer 25 minutes",
    "pomodoro timer",
    "study timer",
    "free online",
    "pomodoro technique for studying",
    "study focus",
    "study time",
  ],
  openGraph: {
    title: "25 Minute Timer - Free Pomodoro Focus Session",
    description: "Start a 25 minute Pomodoro focus session. Free online study timer with break reminders.",
  },
  alternates: {
    canonical: "https://compstudy.tech/25-minute-timer",
  },
};

export default function TwentyFiveMinuteTimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            25 Minute Timer — Free Pomodoro Study Session
          </h1>
          <p className="text-zinc-400">
            Set your free 25 minute Pomodoro timer and focus. The ideal
            study time duration based on the Pomodoro technique for
            studying. Stay productive and focused during study sessions.
          </p>
        </div>
        <TwentyFiveMinuteTimerClient />
      </div>
    </div>
  );
}
