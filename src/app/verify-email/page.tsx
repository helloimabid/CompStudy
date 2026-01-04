"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const { verifyEmail, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  useEffect(() => {
    const handleVerification = async () => {
      if (!userId || !secret) {
        setError("Invalid verification link. Please try again.");
        setLoading(false);
        return;
      }

      try {
        await verifyEmail(userId, secret);
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (err: any) {
        console.error("Email verification error:", err);
        setError(err.message || "Failed to verify email. Link may be expired.");
      } finally {
        setLoading(false);
      }
    };

    handleVerification();
  }, [userId, secret, verifyEmail, router]);

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
            {loading && (
              <>
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Verifying Email...
                </h1>
                <p className="text-zinc-500 text-sm">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {!loading && success && (
              <>
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Email Verified!
                </h1>
                <p className="text-zinc-500 text-sm mb-6">
                  Your email has been successfully verified. Redirecting to
                  dashboard...
                </p>
              </>
            )}

            {!loading && error && (
              <>
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Verification Failed
                </h1>
                <p className="text-zinc-400 text-sm mb-6">{error}</p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium px-4 py-3 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full bg-zinc-800/50 text-white text-sm font-medium px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
