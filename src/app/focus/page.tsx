import { Metadata } from "next";
import FocusClient from "./Client";

export const metadata: Metadata = {
  title: "Focus Mode - Free Online Study Focus Timer for Students",
  description: "Enter distraction-free focus mode for studying. Free online study focus timer with Pomodoro technique, study rooms, and deep work tracking. Overcome learning alone — study with students worldwide.",
  keywords: [
    "study focus",
    "focus and study",
    "focus study room",
    "focus while studying",
    "concentrate to study",
    "learning alone",
    "study app",
    "free online",
    "study timer",
    "deep work timer",
    "students focus",
    "help me focus on studying",
    "room focus",
  ],
  openGraph: {
    title: "Focus Mode - Distraction-Free Study Timer",
    description: "Enter focus mode for deep work and distraction-free studying. Free for all students.",
  },
  alternates: {
    canonical: "https://compstudy.tech/focus",
  },
};

export default function FocusPage() {
  return <FocusClient />;
}
