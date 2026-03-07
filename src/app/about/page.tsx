import { Metadata } from "next";
import AboutClient from "./Client";

export const metadata: Metadata = {
  title: "About CompStudy - Free Online Study App for Students Worldwide",
  description:
    "Learn about CompStudy's mission: a free online learning platform helping students worldwide build study habits, prepare for exams, and study together. Free study rooms, Pomodoro timer, and study community.",
  keywords: [
    "about compstudy",
    "online learning",
    "study app",
    "online study platform",
    "student productivity",
    "students worldwide",
    "free online",
    "study community",
    "global study",
    "study habits",
  ],
  openGraph: {
    title: "About CompStudy - Free Online Study App for Students",
    description:
      "Learn about CompStudy's mission to help students worldwide study together and achieve their academic goals.",
    type: "website",
  },
  alternates: {
    canonical: "https://compstudy.tech/about",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}