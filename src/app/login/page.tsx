"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  const { login, register, loginWithGoogle, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegistering) {
        if (!username) {
          setError("Username is required for registration");
          return;
        }
        await register(email, password, username);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10 px-6">
        <motion.div
          layout
          className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <motion.h1
              key={isRegistering ? "signup" : "login"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-2 tracking-tight"
            >
              {isRegistering ? "Create Account" : "Welcome Back"}
            </motion.h1>
            <motion.p
              key={isRegistering ? "signup-desc" : "login-desc"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-zinc-500 text-sm"
            >
              {isRegistering
                ? "Join the competitive study community today."
                : "Enter your credentials to access your dashboard."}
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center justify-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {isRegistering && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                      placeholder="Username"
                      required={isRegistering}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                placeholder="Email address"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                placeholder="Password"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium px-4 py-3.5 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isRegistering ? "Create Account" : "Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Google OAuth Button */}
          <div className="mt-5 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#0a0a0a]/80 text-zinc-500">
                Or continue with
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loginWithGoogle}
            type="button"
            className="w-full mt-5 bg-white text-zinc-900 text-sm font-medium px-4 py-3.5 rounded-xl hover:bg-zinc-100 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </motion.button>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-zinc-500 mb-3">
              {isRegistering
                ? "Already have an account?"
                : "Don't have an account yet?"}
            </p>
            <button
              onClick={toggleMode}
              className="text-sm font-medium text-white hover:text-indigo-400 transition-colors relative group"
            >
              {isRegistering
                ? "Sign in to your account"
                : "Create a new account"}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-400 transition-all group-hover:w-full"></span>
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
