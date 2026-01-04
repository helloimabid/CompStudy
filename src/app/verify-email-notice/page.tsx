"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VerifyEmailNoticePage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const { user, sendVerificationEmail, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is verified, redirect to dashboard
    if (user?.emailVerification) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setSending(true);
    setError("");

    try {
      await sendVerificationEmail();
      setSent(true);
      setCountdown(60); // 60 second cooldown
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      console.error("Failed to send verification email:", err);
      setError(err.message || "Failed to send verification email");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10 px-6">
        <motion.div
          className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Verify Your Email
            </h1>

            <p className="text-zinc-400 text-sm mb-6">
              We sent a verification link to{" "}
              <span className="text-white font-medium">{user?.email}</span>
            </p>

            <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    Check Your Inbox
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Click the verification link in the email we sent you. Don't
                    forget to check your spam folder if you don't see it.
                  </p>
                </div>
              </div>
            </div>

            {sent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Verification email sent successfully!
              </motion.div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={sending || countdown > 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium px-4 py-3 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Resend Verification Email
                  </>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-zinc-800/50 text-white text-sm font-medium px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Sign Out
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs text-zinc-500">
                Already verified?{" "}
                <button
                  onClick={() => window.location.reload()}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Refresh page
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
