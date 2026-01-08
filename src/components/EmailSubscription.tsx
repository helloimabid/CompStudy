"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { ID } from "appwrite";

interface EmailSubscriptionProps {
  topic?: string;
  title?: string;
  description?: string;
  variant?: "default" | "minimal" | "bento";
  className?: string;
}

export default function EmailSubscription({
  topic = "newsletter",
  title = "Stay Updated",
  description = "Get weekly study tips, productivity hacks, and exclusive content delivered to your inbox.",
  variant = "default",
  className = "",
}: EmailSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Save directly to Appwrite database
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.NEWSLETTER_SUBSCRIBERS,
        ID.unique(),
        {
          email: normalizedEmail,
          topic: topic,
          subscribedAt: new Date().toISOString(),
          status: "active",
        }
      );

      setStatus("success");
      setMessage("You're subscribed! Thank you for joining us.");
      setEmail("");
    } catch (error: any) {
      console.error("Subscription error:", error);

      // Handle duplicate email
      if (error?.code === 409 || error?.message?.includes("duplicate")) {
        setStatus("error");
        setMessage("This email is already subscribed!");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }
  };

  if (variant === "minimal") {
    return (
      <div className={className}>
        <form
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === "loading" || status === "success"}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : status === "success" ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Subscribed
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 text-sm ${
                status === "error" ? "text-red-400" : "text-green-400"
              }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === "bento") {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] group ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">
              Newsletter
            </span>
          </div>

          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-zinc-400 mb-6">{description}</p>

          <form onSubmit={handleSubscribe} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={status === "loading" || status === "success"}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 text-sm"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="w-full px-4 py-3 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : status === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  You're in!
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-3 text-xs ${
                  status === "error" ? "text-red-400" : "text-green-400"
                }`}
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Default variant - full width CTA
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl border border-white/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>
                Join {topic === "newsletter" ? "10,000+" : "Our"} Students
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {title}
            </h2>
            <p className="text-zinc-400 mb-8">{description}</p>

            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={status === "loading" || status === "success"}
                  className="w-full px-5 py-4 rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="px-8 py-4 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {status === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : status === "success" ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Subscribed!
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <AnimatePresence>
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 text-sm ${
                    status === "error" ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>

            <p className="mt-4 text-xs text-zinc-500">
              No spam, ever. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
