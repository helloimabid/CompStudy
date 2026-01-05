"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Sparkles,
  Star,
  Zap,
  Copy,
  Check,
  Smartphone,
  Wallet,
  Twitter,
  Share2,
} from "lucide-react";
import clsx from "clsx";

const DONATION_TIERS = [
  {
    id: "small",
    name: "Cup of Tea",
    amount: "৳50",
    emoji: "🍵",
    description: "A quick pick-me-up",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
  },
  {
    id: "medium",
    name: "Lunch Treat",
    amount: "৳100",
    emoji: "🍱",
    description: "Keep the code flowing",
    color: "from-orange-500/20 to-red-500/20",
    borderColor: "border-orange-500/30",
    textColor: "text-orange-400",
    popular: true,
  },
  {
    id: "large",
    name: "Night Snacks",
    amount: "৳200",
    emoji: "🍕",
    description: "Fuel for late-night coding",
    color: "from-red-500/20 to-pink-500/20",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
  },
  {
    id: "xl",
    name: "Champion Support",
    amount: "৳500",
    emoji: "🏆",
    description: "You're amazing!",
    color: "from-pink-500/20 to-purple-500/20",
    borderColor: "border-pink-500/30",
    textColor: "text-pink-400",
  },
];

const SUPPORTERS = [
  { name: "Anonymous", amount: "৳100", message: "Love this app!" },
  { name: "StudyHero", amount: "৳200", message: "Keep up the great work!" },
  { name: "FocusMaster", amount: "৳50", message: "☕" },
];

const BKASH_NUMBER = "01918742161";

export default function SupportPage() {
  const [selectedTier, setSelectedTier] = useState("medium");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(BKASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
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
            CompStudy is built with love and dedication. If you find it helpful,
            consider supporting to keep the development going!
          </p>
        </div>

        {/* Donation Tiers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {DONATION_TIERS.map((tier) => (
            <motion.button
              key={tier.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTier(tier.id)}
              className={clsx(
                "relative rounded-xl border p-4 md:p-5 text-left transition-all",
                selectedTier === tier.id
                  ? `bg-gradient-to-br ${tier.color} ${tier.borderColor}`
                  : "bg-[#0a0a0a] border-white/10 hover:border-white/20"
              )}
            >
              {tier.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-medium">
                  Popular
                </span>
              )}
              <div className="text-2xl md:text-3xl mb-2">{tier.emoji}</div>
              <div className="text-lg md:text-xl font-bold text-white mb-1">
                {tier.amount}
              </div>
              <div className="text-xs text-zinc-400">{tier.name}</div>
            </motion.button>
          ))}
        </div>

        {/* bKash Payment Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-red-500/10 p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col items-center text-center">
            {/* bKash Logo/Icon */}
            <div className="w-20 h-20 rounded-2xl bg-[#E2136E] flex items-center justify-center mb-4">
              <Wallet className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              Send via bKash
            </h3>
            <p className="text-zinc-400 mb-6">
              Send money to the following bKash number
            </p>

            {/* bKash Number */}
            <div className="flex items-center gap-3 mb-6">
              <div className="px-6 py-4 bg-black/50 rounded-xl border border-pink-500/30">
                <span className="text-2xl md:text-3xl font-mono font-bold text-pink-400 tracking-wider">
                  {BKASH_NUMBER}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="p-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 transition-all"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-green-400" />
                ) : (
                  <Copy className="w-6 h-6 text-pink-400" />
                )}
              </motion.button>
            </div>

            {/* Instructions */}
            <div className="bg-black/30 rounded-xl p-4 md:p-6 w-full max-w-md">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center justify-center gap-2">
                <Smartphone className="w-4 h-4 text-pink-400" />
                How to Send
              </h4>
              <ol className="text-left text-sm text-zinc-400 space-y-2">
                <li className="flex gap-2">
                  <span className="text-pink-400 font-medium">1.</span>
                  Open bKash app or dial *247#
                </li>
                <li className="flex gap-2">
                  <span className="text-pink-400 font-medium">2.</span>
                  Select &quot;Send Money&quot;
                </li>
                <li className="flex gap-2">
                  <span className="text-pink-400 font-medium">3.</span>
                  Enter:{" "}
                  <span className="text-white font-mono">{BKASH_NUMBER}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-pink-400 font-medium">4.</span>
                  Enter amount (e.g.,{" "}
                  <span className="text-white">
                    {DONATION_TIERS.find((t) => t.id === selectedTier)?.amount}
                  </span>
                  )
                </li>
                <li className="flex gap-2">
                  <span className="text-pink-400 font-medium">5.</span>
                  Add reference: &quot;CompStudy Support&quot;
                </li>
                <li className="flex gap-2">
                  <span className="text-pink-400 font-medium">6.</span>
                  Confirm and enter PIN
                </li>
              </ol>
            </div>

            {/* Selected Tier Info */}
            <div className="mt-6 text-center">
              <p className="text-zinc-500 text-sm">
                Selected:{" "}
                <span className="text-white font-medium">
                  {DONATION_TIERS.find((t) => t.id === selectedTier)?.name}
                </span>{" "}
                -{" "}
                <span className="text-pink-400 font-bold">
                  {DONATION_TIERS.find((t) => t.id === selectedTier)?.amount}
                </span>
              </p>
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
        </div>

        {/* Footer Message */}
        <div className="text-center mt-12">
          <p className="text-zinc-500 text-sm">
            Every taka counts! Thank you for supporting CompStudy. ❤️
          </p>
        </div>
      </div>
    </main>
  );
}
