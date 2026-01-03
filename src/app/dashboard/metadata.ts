import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Dashboard - Track Your Focus Time & Productivity",
  description:
    "View your study statistics, track daily streaks, monitor total study hours, and see recent study sessions. Personal study analytics dashboard.",
  openGraph: {
    title: "Study Dashboard - CompStudy",
    description: "Track your study progress, view statistics, and manage your study sessions.",
  },
  alternates: {
    canonical: "https://compstudy.pages.dev/dashboard",
  },
  robots: {
    index: false, // Private dashboard shouldn't be indexed
    follow: true,
  },
};
