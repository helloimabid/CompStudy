import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Dashboard - Track Study Hours, Streaks & Focus Time",
  description:
    "Personal study dashboard to view your study statistics, track daily streaks, monitor total study hours, and manage study sessions. Free study tracker and analytics.",
  openGraph: {
    title: "Study Dashboard - Track Your Study Progress",
    description: "Track your study hours, view study statistics, and manage your study sessions.",
  },
  alternates: {
    canonical: "https://compstudy.tech/dashboard",
  },
  robots: {
    index: false, // Private dashboard shouldn't be indexed
    follow: true,
  },
};
