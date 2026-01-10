"use client";

import { useEffect, useState } from "react";
import { 
  ArrowRight, Download, Smartphone, Star, Shield, Zap, 
  Users, Clock, Trophy, ChevronRight, BarChart3, Globe 
} from "lucide-react";
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

  useEffect(() => {
    const fetchAppLink = async () => {
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.APP_LINKS,
          [Query.equal('platform', 'android'), Query.equal('isActive', true), Query.limit(1)]
        );
        if (response.documents.length > 0) {
          setAppLink(response.documents[0] as unknown as AppLink);
        }
      } catch (error) {
        console.error('Failed to fetch app link:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppLink();
  }, []);

  const handleDownload = () => {
    if (appLink?.downloadLink) window.open(appLink.downloadLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 bg-grid-dots z-0 opacity-40 pointer-events-none" />
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Navigation / Header */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <span className="font-bold text-indigo-400">C</span>
          </div>
          <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">CompStudy</span>
        </Link>
        <Link href="/" className="text-xs font-medium text-zinc-500 hover:text-white transition-colors border border-white/5 px-4 py-2 rounded-full glass hover:bg-white/5">
          Back to Web
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-24">
        
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 mb-32">
          
          {/* Left: Text Content */}
          <div className="flex-1 text-center lg:text-left pt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6 animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Mobile App v{appLink?.version || '1.0'} Live
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Your Pocket <br />
              <span className="text-gradient">Study Station.</span>
            </h1>

            <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience the full power of CompStudy on Android. 
              Real-time battles, live study rooms, and progress tracking—optimized for your phone.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={handleDownload}
                disabled={loading || !appLink}
                className="group relative w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-bold overflow-hidden transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  {loading ? 'Loading...' : 'Download APK'}
                </span>
              </button>
              
              <div className="flex items-center gap-4 text-zinc-500 text-sm px-4">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center text-[10px] text-white font-medium">
                      U{i}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">50K+ Students</span>
                  <span className="text-xs">Joined this month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 3D Phone Mockup */}
          <div className="flex-1 perspective-1000 w-full max-w-[400px] mx-auto lg:max-w-none">
            <div className="relative animate-float preserve-3d">
              {/* Phone Body */}
              <div className="relative mx-auto border-zinc-800 bg-[#050505] border-[12px] rounded-[3rem] h-[650px] w-[320px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
                
                {/* Dynamic Screen Content */}
                <div className="flex-1 bg-zinc-900 relative overflow-hidden">
                  {/* Background Grid inside phone */}
                  <div className="absolute inset-0 bg-grid-dots opacity-20"></div>
                  
                  {/* Header inside phone */}
                  <div className="pt-12 px-6 pb-6 bg-gradient-to-b from-indigo-900/50 to-transparent">
                    <div className="flex justify-between items-center mb-6">
                      <div className="h-8 w-8 rounded-full bg-white/10" />
                      <div className="h-4 w-24 rounded-full bg-white/10" />
                    </div>
                    <div className="h-8 w-3/4 rounded-lg bg-white/20 mb-3" />
                    <div className="h-4 w-1/2 rounded-lg bg-white/10" />
                  </div>

                  {/* Mock Stats Cards inside phone */}
                  <div className="px-4 space-y-3">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <Zap size={16} />
                        </div>
                        <span className="text-green-400 text-xs">+12%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full w-[70%] bg-indigo-500"></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 border border-white/10 text-white">
                      <div className="flex items-center gap-3">
                        <Trophy size={20} className="text-yellow-300" />
                        <div>
                          <p className="text-xs opacity-80">Current Rank</p>
                          <p className="font-bold">Diamond III</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Simulated List */}
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-zinc-800" />
                        <div className="space-y-1">
                          <div className="w-20 h-2 bg-zinc-700 rounded" />
                          <div className="w-12 h-2 bg-zinc-800 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scan Effect Overlay */}
                  <div className="absolute inset-0 pointer-events-none crt-overlay opacity-30"></div>
                  <div className="absolute top-0 w-full h-[2px] bg-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-[scan_3s_linear_infinite]"></div>
                </div>
              </div>
              
              {/* Reflection/Shadow under phone */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[200px] h-[20px] bg-black/50 blur-xl rounded-full" />
            </div>
          </div>
        </div>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          
          {/* Large Feature Card */}
          <div className="col-span-1 md:col-span-2 row-span-2 glass rounded-3xl p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <Smartphone size={200} />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Connect Anywhere</h3>
                <p className="text-zinc-400">Sync your study sessions seamlessly between desktop and mobile. Start on your PC, finish on the bus.</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs border border-white/5">Android</span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs border border-white/5">iOS (Soon)</span>
              </div>
            </div>
          </div>

          {/* Stat Card 1 */}
          <div className="col-span-1 glass rounded-3xl p-6 flex flex-col justify-center items-center text-center group hover:bg-white/5 transition-colors">
             <div className="font-orbitron text-4xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">4.8</div>
             <div className="flex gap-1 text-yellow-500 mb-2">
               {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
             </div>
             <p className="text-sm text-zinc-500">App Store Rating</p>
          </div>

          {/* Stat Card 2 */}
          <div className="col-span-1 glass rounded-3xl p-6 flex flex-col justify-center items-center text-center group hover:bg-white/5 transition-colors">
             <div className="font-orbitron text-4xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">1M+</div>
             <p className="text-sm text-zinc-500">Study Hours Logged</p>
          </div>

          {/* Feature: Focus Mode */}
          <div className="col-span-1 md:col-span-2 glass rounded-3xl p-8 flex items-center gap-6 group hover:border-purple-500/30 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Deep Focus Mode</h3>
              <p className="text-sm text-zinc-400">Block distractions and notifications while you study. Earn 2x XP during focus sessions.</p>
            </div>
          </div>

          {/* Feature: Gamification */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 glass rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Compete & Win</h3>
              <p className="text-sm text-zinc-400 mb-4">Climb the global leaderboards and unlock exclusive profile frames.</p>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full w-[85%] animate-pulse" />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}