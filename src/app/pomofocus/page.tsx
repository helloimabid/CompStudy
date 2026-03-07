import { Metadata } from "next";
import PomofocusClient from "./Client";

export const metadata: Metadata = {
  title: "Pomofocus Alternative - Free Study App & Pomodoro Timer",
  description: "Best Pomofocus alternative with free study rooms, leaderboards, and study tracking. Free Pomodoro timer and study app for students. Study together online with focus mode.",
  keywords: [
    "pomofocus",
    "pomofocus alternative",
    "pomodoro timer",
    "focus timer",
    "free study app",
    "study app",
    "study focus",
    "study together",
    "free online",
    "online study",
    "pomodoro technique for studying",
  ],
  openGraph: {
    title: "Pomofocus Alternative - Free Study App with Study Rooms",
    description: "Better than Pomofocus — free Pomodoro timer with study rooms, leaderboards, and study tracking.",
  },
  alternates: {
    canonical: "https://compstudy.tech/pomofocus",
  },
};

export default function PomoFocusPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Pomofocus Alternative — Free Study App & Pomodoro Timer
          </h1>
          <p className="text-zinc-400">
            The best Pomofocus alternative with free online study rooms,
            leaderboards, and study tracking. Study together online with
            enhanced focus features and the Pomodoro technique for studying.
          </p>
        </div>
        <PomofocusClient />
      </div>
    </div>
  );
}
