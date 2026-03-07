import { Metadata } from "next";
import TimerClient from "./Client";

export const metadata: Metadata = {
  title: "Free Online Timer - Study Timer & Focus Countdown",
  description: "Free online timer for studying, focusing, and time management. Study timer with countdown, study rooms, and tracking. Perfect for exam preparation and online study sessions.",
  keywords: [
    "online timer",
    "countdown timer",
    "study timer",
    "focus timer",
    "free timer online",
    "free online",
    "study time",
    "study focus",
    "time management study",
    "exam preparation",
    "study app",
  ],
  openGraph: {
    title: "Free Online Timer - Study & Focus Countdown Timer",
    description: "Versatile free online timer for studying, focusing, and productivity. No signup required.",
  },
  alternates: {
    canonical: "https://compstudy.tech/timer",
  },
};

export default function TimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Free Online Timer — Study & Focus Countdown
          </h1>
          <p className="text-zinc-400">
            Versatile free online timer for all your study needs. Use as
            countdown timer, study timer, or focus timer for exam
            preparation. Time management made simple.
          </p>
        </div>
        <TimerClient />
      </div>
    </div>
  );
}
