import { Metadata } from "next";
import PomodoroTimerClient from "./Client";

export const metadata: Metadata = {
  title: "Pomodoro Timer Online - Free Study Timer with Breaks",
  description: "Free online Pomodoro timer for studying with 25/5 minute intervals. Best study app with focus timer, break reminders, study rooms, and study time tracking. Students free to use.",
  keywords: [
    "pomodoro timer",
    "pomodoro timer online",
    "25 minute timer",
    "focus timer",
    "study timer with breaks",
    "productivity timer",
    "free online",
    "study app",
    "study timer",
    "pomodoro technique for studying",
    "study focus",
    "study sessions",
  ],
  openGraph: {
    title: "Free Pomodoro Timer Online - Study Timer with Breaks",
    description: "Free Pomodoro timer for studying online. 25/5 intervals, focus tracking, and study rooms.",
  },
  alternates: {
    canonical: "https://compstudy.tech/pomodoro-timer",
  },
};

export default function PomodoroTimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Free Pomodoro Timer Online — Study App for Focus
          </h1>
          <p className="text-zinc-400">
            Free online Pomodoro Timer with 25-minute study sessions and
            5-minute breaks. The best study app for students — boost your
            study focus with the proven Pomodoro technique for studying.
          </p>
        </div>
        <PomodoroTimerClient />
      </div>
    </div>
  );
}
