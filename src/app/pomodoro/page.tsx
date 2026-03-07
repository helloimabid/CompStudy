import { Metadata } from "next";
import PomodoroClient from "./Client";

export const metadata: Metadata = {
  title: "Pomodoro Technique for Studying - Free Online Pomodoro Timer",
  description: "Master the Pomodoro technique for studying with our free online timer. 25/5 intervals, break reminders, study sessions tracking, and focus mode. Best free study app for exam preparation.",
  keywords: [
    "pomodoro technique for studying",
    "pomodoro technique",
    "pomodoro timer",
    "study pomodoro technique",
    "pomodoro technique learning",
    "pomodoro technique of study",
    "pomodoro study room",
    "free online",
    "study sessions",
    "study focus",
  ],
  openGraph: {
    title: "Pomodoro Technique for Studying - Free Timer Online",
    description: "Master the proven Pomodoro technique for studying. Free 25/5 timer with study rooms and progress tracking.",
  },
  alternates: {
    canonical: "https://compstudy.tech/pomodoro",
  },
};

export default function PomodoroPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Pomodoro Technique for Studying — Free Online Timer
          </h1>
          <p className="text-zinc-400">
            Master the Pomodoro technique for studying with focused 25-minute
            study sessions followed by short breaks. Build better study habits,
            track study time, and improve concentration.
          </p>
        </div>
        <PomodoroClient />
      </div>
    </div>
  );
}
