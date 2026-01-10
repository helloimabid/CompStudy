"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Download, Smartphone, Star, Shield, Zap, Users, Clock, Trophy } from "lucide-react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";

interface AppLink {
  $id: string;
  name: string;
  downloadLink: string;
  platform: string;
  version: string;
  isActive: boolean;
}

export default function DownloadPage() {
  const [appLink, setAppLink] = useState<AppLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppLink();
  }, []);

  const fetchAppLink = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.APP_LINKS,
        [
          Query.equal('platform', 'android'),
          Query.equal('isActive', true),
          Query.limit(1)
        ]
      );

      if (response.documents.length > 0) {
        setAppLink(response.documents[0] as unknown as AppLink);
      } else {
        setError('Android app download link not available');
      }
    } catch (error) {
      console.error('Failed to fetch app link:', error);
      setError('Failed to load download link');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (appLink?.downloadLink) {
      window.open(appLink.downloadLink, '_blank');
    }
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Optimized performance for seamless studying"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Study Together",
      description: "Join live study rooms with thousands of students"
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Compete & Win",
      description: "Climb leaderboards and earn achievements"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Track Progress",
      description: "Monitor your study sessions and productivity"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Stay Focused",
      description: "Advanced focus modes to eliminate distractions"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Earn Rewards",
      description: "Unlock features as you build study streaks"
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Users" },
    { value: "1M+", label: "Study Hours" },
    { value: "4.8★", label: "App Rating" },
    { value: "100+", label: "Countries" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading download page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero Section */}
      <section className="relative pt-20 md:pt-32 pb-16 md:pb-24 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-100 md:w-150 h-75 md:h-100 bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <Smartphone className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-white tracking-tight mb-6 leading-[1.1]">
            Study on the Go
            <br />
            <span className="text-gradient">Anytime, Anywhere.</span>
          </h1>

          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Take your productivity to the next level with the CompStudy mobile app. 
            Join study rooms, track your progress, and compete with students worldwide - 
            all from your phone.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {appLink ? (
              <button
                onClick={handleDownload}
                className="group relative px-8 py-4 rounded-full bg-zinc-100 text-black text-sm font-medium hover:bg-zinc-200 transition-all w-full sm:w-auto overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download for Android
                  <ArrowRight strokeWidth={1.5} width={16} />
                </span>
              </button>
            ) : (
              <div className="px-8 py-4 rounded-full border border-zinc-700 text-zinc-400 text-sm font-medium w-full sm:w-auto">
                {error || 'Download Coming Soon'}
              </div>
            )}
            
            <Link
              href="/"
              className="px-8 py-4 rounded-full border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-all w-full sm:w-auto bg-[#050505]/50"
            >
              Back to Website
            </Link>
          </div>

          {/* App Preview */}
          <div className="relative max-w-md mx-auto">
            <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl">
              <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
              <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <Smartphone className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">CompStudy</h3>
                    <p className="text-sm opacity-90">Study Together, Compete Forever</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-4">
              Why Choose CompStudy Mobile?
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Everything you love about CompStudy, now in your pocket. 
              Study smarter with features designed for mobile productivity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bento-card p-6 rounded-xl border border-white/10 bg-[#0a0a0a]">
                <div className="w-12 h-12 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-4 text-indigo-400">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-6">
            Ready to Transform Your Study Sessions?
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Join thousands of students who are already studying smarter with CompStudy.
          </p>
          
          {appLink ? (
            <button
              onClick={handleDownload}
              className="group relative px-8 py-4 rounded-full bg-zinc-100 text-black text-sm font-medium hover:bg-zinc-200 transition-all"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Download Now - Free Forever
                <ArrowRight strokeWidth={1.5} width={16} />
              </span>
            </button>
          ) : (
            <div className="px-8 py-4 rounded-full border border-zinc-700 text-zinc-400 text-sm font-medium">
              {error || 'Join Waitlist for Mobile App'}
            </div>
          )}
          
          {appLink && (
            <p className="text-xs text-zinc-500 mt-4">
              Version {appLink.version} • Compatible with Android 7.0+
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
