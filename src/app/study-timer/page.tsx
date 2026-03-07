import { Metadata } from "next";
import StudyTimerClient from "./Client";

export const metadata: Metadata = {
  title: "Study Timer Online - Free Focus & Study App for Students",
  description: "Free online study timer with Pomodoro technique, study rooms, and progress tracking. Best study app for students to manage study time, study schedule, and exam preparation.",
  keywords: [
    "study timer",
    "study timer online",
    "focus study timer",
    "free study timer",
    "study app",
    "study time",
    "study schedule",
    "study focus",
    "online study",
    "free online",
    "students free",
    "study tracker",
    "study hours",
    "time management study",
  ],
  openGraph: {
    title: "Free Study Timer Online - Study App for Students",
    description: "Professional study timer with Pomodoro technique, study rooms, and analytics. Free for all students.",
  },
  alternates: {
    canonical: "https://compstudy.tech/study-timer",
  },
};

export default function StudyTimerPage() {
  return (
    <div className="min-h-screen bg-[#050505] pt-14">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Free Study Timer Online — Study App for Students
          </h1>
          <p className="text-zinc-400">
            Free online study timer designed for students. Manage your study
            schedule, track study hours, and build better study habits with
            the Pomodoro technique. Study together with students worldwide.
          </p>
        </div>
        <StudyTimerClient />
      </div>
    </div>
  );
}
