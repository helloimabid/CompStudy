import { Zap, Globe, BarChart2, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16 lg:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight mb-4 md:mb-6 px-4">
            Features built for{" "}
            <span className="text-gradient">peak performance</span>.
          </h1>
          <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto px-4">
            CompStudy combines the best of productivity tools with competitive
            gaming mechanics to keep you focused longer.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[280px] md:auto-rows-[300px]">
          {/* Card 1: Global Study Rooms (Large, Span 2) */}
          <div className="bento-card md:col-span-2 relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10 pointer-events-none"></div>
            <div className="p-6 relative z-20 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center backdrop-blur-md">
                  <Globe className="text-indigo-400" width={20} />
                </div>
                <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-[10px] font-medium text-green-400 flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  Live Now
                </div>
              </div>

              {/* Realistic Mini UI: Room List */}
              <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 lg:w-[280px] p-4 md:p-6 pt-12 md:pt-16 flex flex-col gap-2 md:gap-3 mask-image-b opacity-30 md:opacity-60 lg:opacity-100">
                <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-2 md:p-3 shadow-lg transform translate-x-2 md:translate-x-4 group-hover:translate-x-0 transition-transform duration-500">
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <div className="text-[10px] md:text-xs font-medium text-white">
                      🔥 MCAT Prep
                    </div>
                    <div className="text-[10px] text-zinc-500">1.2k users</div>
                  </div>
                  <div className="w-full bg-zinc-800 h-1 rounded-full">
                    <div className="bg-orange-500 h-1 w-[80%] rounded-full"></div>
                  </div>
                </div>
                <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-3 shadow-lg transform translate-x-8 group-hover:translate-x-0 transition-transform duration-500 delay-75">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-medium text-white">
                      ⚛️ Quantum Mech
                    </div>
                    <div className="text-[10px] text-zinc-500">430 users</div>
                  </div>
                  <div className="w-full bg-zinc-800 h-1 rounded-full">
                    <div className="bg-indigo-500 h-1 w-[45%] rounded-full"></div>
                  </div>
                </div>
                <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-3 shadow-lg transform translate-x-12 group-hover:translate-x-0 transition-transform duration-500 delay-150">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-medium text-white">
                      📚 Law School
                    </div>
                    <div className="text-[10px] text-zinc-500">890 users</div>
                  </div>
                  <div className="w-full bg-zinc-800 h-1 rounded-full">
                    <div className="bg-blue-500 h-1 w-[60%] rounded-full"></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-medium text-zinc-100 mb-1 md:mb-2">
                  Global Study Rooms
                </h3>
                <p className="text-xs md:text-sm text-zinc-500 leading-relaxed max-w-sm">
                  Join subject-specific rooms with students from around the
                  world. Whether it's MCAT prep, Law, or Coding, find your
                  tribe.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Competitive Streaks (Tall/Standard) */}
          <div className="bento-card relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group">
            <div className="p-6 h-full flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-6">
                <Zap className="text-orange-500" width={20} />
              </div>

              {/* Realistic Mini UI: Calendar/Streak */}
              <div className="flex-1 flex items-center justify-center mb-3 md:mb-4">
                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-zinc-800/50"></div>
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-orange-500/20 text-orange-500 flex items-center justify-center text-[7px] md:text-[8px]">
                    M
                  </div>
                  <div className="w-6 h-6 rounded bg-orange-500/40 text-orange-500 flex items-center justify-center text-[8px]">
                    T
                  </div>
                  <div className="w-6 h-6 rounded bg-orange-500 text-black flex items-center justify-center text-[8px] font-bold shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                    W
                  </div>
                  <div className="w-6 h-6 rounded bg-zinc-800/50"></div>
                  <div className="w-6 h-6 rounded bg-zinc-800/50"></div>
                  <div className="w-6 h-6 rounded bg-zinc-800/50"></div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-100 mb-1">
                  Competitive Streaks
                </h3>
                <p className="text-sm text-zinc-500">
                  Build consistency with daily streaks. Don't break the chain!
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Deep Focus Analytics (Wide, Span 2) */}
          <div className="bento-card md:col-span-2 relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group">
            <div className="absolute top-0 right-0 p-6 z-20">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 border border-white/5 rounded-full px-2 py-1 bg-zinc-900/50">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>{" "}
                Last 7 Days
              </div>
            </div>
            <div className="p-6 h-full flex flex-col justify-end relative z-10">
              {/* Realistic Mini UI: Bar Chart */}
              <div className="absolute inset-0 flex items-end justify-center px-4 md:px-6 pb-20 md:pb-24 gap-2 md:gap-3 lg:gap-6 opacity-80 group-hover:scale-105 transition-transform duration-500 origin-bottom">
                <div className="w-6 md:w-8 bg-zinc-800/50 h-[30%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                <div className="w-6 md:w-8 bg-zinc-800/50 h-[50%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                <div className="w-6 md:w-8 bg-zinc-800/50 h-[40%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                <div className="w-6 md:w-8 bg-zinc-800/50 h-[70%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                <div className="w-6 md:w-8 bg-indigo-500/80 h-[85%] rounded-t-sm relative shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <div className="absolute -top-5 md:-top-6 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] text-indigo-300 font-medium">
                    8.5h
                  </div>
                </div>
                <div className="w-8 bg-zinc-800/50 h-[60%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
                <div className="w-8 bg-zinc-800/50 h-[20%] rounded-t-sm relative group-hover:bg-zinc-800 transition-colors"></div>
              </div>

              <div className="relative z-20 pt-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent">
                <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-2 md:mb-3">
                  <BarChart2 className="text-indigo-400" width={20} />
                </div>
                <h3 className="text-base md:text-lg font-medium text-zinc-100 mb-1">
                  Deep Focus Analytics
                </h3>
                <p className="text-xs md:text-sm text-zinc-500">
                  Get detailed insights into your study habits. Track your most
                  productive hours and session lengths.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Strict Mode (Standard) */}
          <div className="bento-card relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group">
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center">
                  <Shield className="text-green-500" width={20} />
                </div>
                <div className="relative inline-block w-8 align-middle select-none">
                  <div className="block w-8 h-4 rounded-full bg-green-500"></div>
                  <div className="absolute right-0 top-0 block w-4 h-4 rounded-full bg-white border-4 border-[#0a0a0a]"></div>
                </div>
              </div>

              {/* Realistic Mini UI: Lock Screen */}
              <div className="flex-1 flex items-center justify-center mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="text-center">
                  <div className="text-4xl mb-2">🔒</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Focus Mode Active
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-100 mb-1">
                  Strict Mode
                </h3>
                <p className="text-sm text-zinc-500">
                  Lock distractions out. Prevent leaving the room during a
                  session.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 md:mt-20 text-center">
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
              Ready to maximize your focus?
            </h2>
            <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
              Join thousands of students already improving their productivity
            </p>
            <Link
              href="/start-studying"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-100 text-black text-sm font-medium hover:bg-zinc-200 transition-all"
            >
              Start Studying Now
              <ArrowRight strokeWidth={1.5} width={16} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
