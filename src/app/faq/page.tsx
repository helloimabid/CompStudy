import { Metadata } from "next";
import FAQClient from "./Client";

export const metadata: Metadata = {
  title: "FAQ - Free Online Study App Questions | CompStudy",
  description: "Find answers to common questions about CompStudy's free study app, Pomodoro timer, online study rooms, leaderboards, and study features. Get help with our free online study platform for students.",
  keywords: [
    "compstudy faq",
    "study timer help",
    "pomodoro timer questions",
    "online study room help",
    "study app support",
    "free online study",
    "study app",
    "free study app",
    "students free",
  ],
  openGraph: {
    title: "FAQ - Frequently Asked Questions | CompStudy",
    description: "Find answers to common questions about CompStudy's free online study app and tools.",
    type: "website",
  },
  alternates: {
    canonical: "https://compstudy.tech/faq",
  },
};

export default function FAQPage() {
  return <FAQClient />;
}
