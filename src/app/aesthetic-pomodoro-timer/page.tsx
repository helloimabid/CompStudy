import { Metadata } from "next";
import AestheticPomodoroTimerClient from "./Client";

export const metadata: Metadata = {
  title: "Aesthetic Pomodoro Timer - Beautiful Free Study App",
  description: "Beautiful aesthetic Pomodoro timer with clean design. Free online study app with focus mode, study rooms, and study tracking. Students free to use for exam preparation and study sessions.",
  keywords: [
    "aesthetic pomodoro timer",
    "beautiful pomodoro timer",
    "aesthetic timer",
    "pretty study timer",
    "study app",
    "free online",
    "study focus",
    "pomodoro timer",
    "study timer",
    "free study app",
    "study streaming",
  ],
  openGraph: {
    title: "Aesthetic Pomodoro Timer - Beautiful Free Study Timer",
    description: "Stunning aesthetic Pomodoro timer for studying. Free with focus mode and study tracking.",
  },
  alternates: {
    canonical: "https://compstudy.tech/aesthetic-pomodoro-timer",
  },
};

export default function AestheticPomodoroTimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Aesthetic Pomodoro Timer — Beautiful Free Study App
          </h1>
          <p className="text-zinc-400">
            Stunning aesthetic Pomodoro timer with customizable themes. The
            most beautiful free study app with focus mode, study rooms, and
            study tracking for students.
          </p>
        </div>
        <AestheticPomodoroTimerClient />
      </div>
    </div>
  );
}
