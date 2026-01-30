"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Smartphone,
  Star,
  Shield,
  Zap,
  Clock,
  Users,
  Trophy,
  Play,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";

interface AppLink {
  $id: string;
  name: string;
  downloadLink: string;
  platform: string;
  version: string;
  isActive: boolean;
  downloads: number;
}

const features = [
  {
    icon: Clock,
    title: "Pomodoro Timer",
    description: "Built-in focus timer with customizable sessions",
  },
  {
    icon: Users,
    title: "Live Study Rooms",
    description: "Study with others in real-time virtual rooms",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Compete and track your progress globally",
  },
  {
    icon: Zap,
    title: "Offline Support",
    description: "Study anywhere, even without internet",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays secure and private",
  },
  {
    icon: Star,
    title: "Free Forever",
    description: "All core features completely free",
  },
];

export default function AppPage() {
  const [appData, setAppData] = useState<AppLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    loadAppData();
  }, []);

  const loadAppData = async () => {
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.APP_LINKS,
        [
          Query.equal("platform", "Android"),
          Query.equal("isActive", true),
          Query.limit(1),
        ],
      );

      if (response.documents.length > 0) {
        setAppData(response.documents[0] as unknown as AppLink);
      }
    } catch (error) {
      console.error("Failed to load app data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDownloads = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M+";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K+";
    }
    return num.toString() + "+";
  };

  const handleDownloadClick = async () => {
    if (!appData) return;
    
    try {
      // Increment downloads count in the database
      const newDownloads = (appData.downloads || 0) + 1;
      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.APP_LINKS,
        appData.$id,
        { downloads: newDownloads }
      );
      
      // Update local state to reflect the change
      setAppData({ ...appData, downloads: newDownloads });
    } catch (error) {
      console.error("Failed to update download count:", error);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505]">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-125 h-125 bg-indigo-500/8 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-100 h-100 bg-green-500/6 blur-[120px] rounded-full" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[40px_40px]" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8">
                <Smartphone className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">
                  Android App Available
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-[1.1] mb-6">
                Study smarter
                <span className="block mt-2 text-transparent bg-clip-text bg-linear-to-r from-green-300 via-emerald-300 to-teal-300">
                  on the go
                </span>
              </h1>

              <p className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-lg">
                Take your study sessions anywhere with the CompStudy Android
                app. All the features you love, optimized for mobile.
              </p>

              {/* Download Stats */}
              <div className="flex items-center gap-8 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Download className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-white">
                      {loading
                        ? "..."
                        : formatDownloads(appData?.downloads || 0)}
                    </div>
                    <div className="text-sm text-zinc-500">Downloads</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-white">4.8</div>
                    <div className="text-sm text-zinc-500">Rating</div>
                  </div>
                </div>
              </div>

              {/* Download Button - APKPure Style */}
              <div className="flex flex-col sm:flex-row gap-4">
                {appData ? (
                  <a
                    href={appData.downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownloadClick}
                    className="group inline-flex items-center gap-4 px-6 py-3 bg-[#a4c639] hover:bg-[#8db02e] text-black font-medium rounded-xl transition-all duration-300 shadow-lg shadow-[#a4c639]/25 hover:shadow-[#a4c639]/40"
                  >
                    {/* APKPure Logo */}
                    <img
                      src="/apkpure.png"
                      alt="APKPure"
                      className="w-10 h-10 rounded-lg"
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-xs opacity-80">Get it on</span>
                      <span className="text-lg font-bold tracking-tight">
                        APKPure
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <div className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-zinc-800 text-zinc-400 font-medium rounded-xl">
                    <Download className="w-5 h-5" />
                    <span>Loading...</span>
                  </div>
                )}

                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all duration-300"
                >
                  <span>Try Web Version</span>
                </Link>
              </div>

              {/* Version Info */}
              {appData && (
                <p className="mt-4 text-sm text-zinc-500">
                  Version {appData.version} • Requires Android 7.0+
                </p>
              )}
            </motion.div>

            {/* Right Column - Phone Mockup with Video */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="relative flex justify-center lg:justify-end"
            >
              {/* Phone Frame */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-8 bg-linear-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 blur-3xl rounded-full opacity-50" />

                {/* Phone Device */}
                <div className="relative w-70 sm:w-80 h-145 sm:h-165 bg-linear-to-b from-zinc-800 to-zinc-900 rounded-[3rem] p-2 shadow-2xl shadow-black/50 border border-zinc-700/50">
                  {/* Phone Inner Bezel */}
                  <div className="relative w-full h-full bg-black rounded-[2.5rem] overflow-hidden">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20 flex items-center justify-center">
                      <div className="w-16 h-4 bg-zinc-900 rounded-full flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-800" />
                        <div className="w-1 h-1 rounded-full bg-zinc-700" />
                      </div>
                    </div>

                    {/* Video Container */}
                    <div className="relative w-full h-full">
                      {!isVideoPlaying ? (
                        <div
                          className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center cursor-pointer group"
                          onClick={() => setIsVideoPlaying(true)}
                        >
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                              <Play className="w-8 h-8 text-white ml-1" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">
                              Watch App Preview
                            </span>
                          </div>

                          {/* Decorative Elements */}
                          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30" />
                            <div className="text-white/50 text-xs">
                              CompStudy
                            </div>
                          </div>
                        </div>
                      ) : (
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        >
                          <source
                            src="https://helloimabid.github.io/appCompstudy/demo.mp4"
                            type="video/mp4"
                          />
                        </video>
                      )}
                    </div>

                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>

                {/* Side Buttons */}
                <div className="absolute -right-0.75 top-28 w-1 h-16 bg-zinc-700 rounded-l-sm" />
                <div className="absolute -left-0.75 top-24 w-1 h-8 bg-zinc-700 rounded-r-sm" />
                <div className="absolute -left-0.75 top-36 w-1 h-12 bg-zinc-700 rounded-r-sm" />
                <div className="absolute -left-0.75 top-52 w-1 h-12 bg-zinc-700 rounded-r-sm" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-green-300 to-emerald-300">
                stay focused
              </span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              All the powerful features from the web, optimized for your mobile
              device.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-green-500/20 hover:bg-white/4 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-linear-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10" />
            <div className="absolute inset-0 border border-green-500/20 rounded-3xl" />

            <div className="relative p-10 md:p-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">
                  100% Free to Download
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
                Ready to boost your productivity?
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of students who are already studying smarter with
                CompStudy on Android.
              </p>

              {appData && (
                <a
                  href={appData.downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDownloadClick}
                  className="group inline-flex items-center gap-4 px-6 py-3 bg-[#a4c639] hover:bg-[#8db02e] text-black font-medium rounded-xl transition-all duration-300 shadow-lg shadow-[#a4c639]/25 hover:shadow-[#a4c639]/40"
                >
                  {/* APKPure Logo */}
                  <img
                    src="/apkpure.png"
                    alt="APKPure"
                    className="w-10 h-10 rounded-lg"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-xs opacity-80">Get it on</span>
                    <span className="text-lg font-bold tracking-tight">
                      APKPure
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
