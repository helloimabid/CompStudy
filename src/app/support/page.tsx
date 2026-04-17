"use client";

import { motion } from "framer-motion";
import Script from "next/script";
import { Heart, Sparkles, Star, Zap, Twitter, Share2 } from "lucide-react";

const SUPPORTERS: Array<{ name: string; amount: string; message?: string }> =
  [];

export default function SupportPage() {
  return (
    <>
      <Script
        src="https://www.supportkori.com/widget.js"
        data-id="helloimabid"
        data-message="Support CompStudy"
        data-color="#6366f1"
        data-position="right"
        strategy="afterInteractive"
      />

      <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-red-500/20 border border-pink-500/30 flex items-center justify-center">
                <Heart className="w-8 h-8 text-pink-400" />
              </div>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight mb-4 md:mb-6">
              Support <span className="text-gradient">CompStudy</span>
            </h1>
            <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              CompStudy is built with love and dedication. If you find it
              helpful, consider supporting to keep the development going!
            </p>
          </div>

          {/* SupportKori Payment Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-red-500/10 p-6 md:p-8 mb-8"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-indigo-300" />
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Pay Securely with SupportKori
              </h3>
              <p className="text-zinc-400 mb-6">
                Your support payment is now fully automated through the
                SupportKori widget.
              </p>

              <div className="bg-black/30 rounded-xl p-4 md:p-6 w-full max-w-md">
                <h4 className="text-sm font-medium text-white mb-3">
                  How to Support
                </h4>
                <ol className="text-left text-sm text-zinc-400 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-pink-400 font-medium">1.</span>
                    Tap the SupportKori floating button at the bottom-right.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-pink-400 font-medium">2.</span>
                    Choose your preferred support amount.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-pink-400 font-medium">3.</span>
                    Complete checkout in the widget flow.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-pink-400 font-medium">4.</span>
                    Payment is processed automatically by SupportKori.
                  </li>
                </ol>
              </div>
            </div>
          </motion.div>

          {/* What Your Support Helps */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 md:p-8 mb-8">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              What Your Support Helps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">
                    Server Costs
                  </p>
                  <p className="text-xs text-zinc-500">
                    Keep CompStudy running fast and reliable
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">
                    New Features
                  </p>
                  <p className="text-xs text-zinc-500">
                    Develop awesome new tools for studying
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">
                    Ad-Free Experience
                  </p>
                  <p className="text-xs text-zinc-500">
                    Less reliance on ads in the future
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Other Ways to Support */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 md:p-8 mb-8">
            <h3 className="text-lg font-medium text-white mb-6">
              Other Ways to Support
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://twitter.com/intent/tweet?text=I%20love%20using%20CompStudy%20for%20focused%20studying!%20Check%20it%20out%20at"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
                  <Twitter className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                    Share on Twitter
                  </p>
                  <p className="text-xs text-zinc-500">Help spread the word!</p>
                </div>
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "CompStudy",
                      text: "Check out CompStudy - a study focus app!",
                      url: window.location.origin,
                    });
                  }
                }}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                    Share with Friends
                  </p>
                  <p className="text-xs text-zinc-500">
                    Tell others about CompStudy
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Supporters */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 md:p-8">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Recent Supporters
            </h3>
            {SUPPORTERS.length === 0 ? (
              <div className="rounded-xl bg-zinc-900/50 p-6 text-center">
                <p className="text-sm text-zinc-400">No donations yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {SUPPORTERS.map((supporter, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {supporter.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {supporter.name}
                          </p>
                          {supporter.message && (
                            <p className="text-xs text-zinc-500">
                              &quot;{supporter.message}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-pink-400">
                        {supporter.amount}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-zinc-600 mt-4">
                  Thank you to all our supporters! 💛
                </p>
              </>
            )}
          </div>

          {/* Footer Message */}
          <div className="text-center mt-12">
            <p className="text-zinc-500 text-sm">
              Every taka counts! Thank you for supporting CompStudy. ❤️
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
