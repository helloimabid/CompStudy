import { Metadata } from "next";
import AppClient from "./Client";

export const metadata: Metadata = {
  title: "Download CompStudy App - Free Study App for Android",
  description:
    "Download the CompStudy Android app for free. Study smarter on the go with Pomodoro timer, live study rooms, leaderboards, and offline support. Optimized for mobile learning.",
  keywords: [
    "compstudy app",
    "study app android",
    "download study app",
    "pomodoro timer app",
    "study rooms app",
    "free study app",
    "mobile study app",
    "android learning app",
    "student productivity app",
  ],
  openGraph: {
    title: "Download CompStudy App - Free Study App for Android",
    description:
      "Take your study sessions anywhere with the CompStudy Android app. Pomodoro timer, live rooms, and more — all free.",
    type: "website",
  },
  alternates: {
    canonical: "https://compstudy.tech/app",
  },
};

export default function AppPage() {
  return <AppClient />;
}
