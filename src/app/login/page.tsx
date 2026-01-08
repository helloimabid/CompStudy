"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { account } from "@/lib/appwrite";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const {
    login,
    register,
    loginWithGoogle,
    loading,
    user,
    initiatePasswordRecovery,
  } = useAuth();
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
      console.error("Authentication error:", err);
      const errorMessage = err.message || err.toString() || "An error occurred";
      setError(errorMessage);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setForgotPasswordLoading(true);

    try {
      await initiatePasswordRecovery(forgotPasswordEmail);
      setForgotPasswordSuccess(true);
    } catch (err: any) {
      console.error("Password recovery error:", err);
      setError(err.message || "Failed to send recovery email");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setForgotPasswordSuccess(false);
    setError("");
  };

  // Handle native app Google auth (from Expo mobile app)
  useEffect(() => {
    const handleNativeGoogleAuth = async (event: Event) => {
      const customEvent = event as CustomEvent<{ idToken: string; email: string; name: string }>;
      const { idToken, email, name } = customEvent.detail;

      try {
        const response = await fetch("/api/auth/google-native", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, email, name }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Use the token to create a client-side session
          await account.createSession(data.userId, data.secret);
          window.location.href = "/dashboard";
        } else {
          setError(data.error || "Native Google auth failed");
        }
      } catch (error) {
        console.error("Native auth failed:", error);
        setError("Failed to authenticate with Google");
      }
    };

    // Check for pending native auth on page load (from localStorage)
    const nativeAuth = localStorage.getItem("nativeGoogleAuth");
    if (nativeAuth) {
      try {
        const data = JSON.parse(nativeAuth);
        localStorage.removeItem("nativeGoogleAuth");
        // Create a fake event to reuse the handler
        const fakeEvent = { detail: data } as CustomEvent<{ idToken: string; email: string; name: string }>;
        handleNativeGoogleAuth(fakeEvent);
      } catch (e) {
        console.error("Failed to parse native auth data:", e);
        localStorage.removeItem("nativeGoogleAuth");
      }
    }

    // Listen for native Google auth events
    window.addEventListener("nativeGoogleAuth", handleNativeGoogleAuth);

    return () => {
      window.removeEventListener("nativeGoogleAuth", handleNativeGoogleAuth);
    };
  }, []);

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
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {!isRegistering && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

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
            onClick={() => {
              try {
                loginWithGoogle();
              } catch (err: any) {
                setError(err.message || "Failed to initiate Google login");
              }
            }}
            type="button"
            disabled={loading}
            className="w-full mt-5 bg-white text-zinc-900 text-sm font-medium px-4 py-3.5 rounded-xl hover:bg-zinc-100 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Forgot Password Modal */}
        <AnimatePresence>
          {showForgotPassword && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={closeForgotPasswordModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                {forgotPasswordSuccess ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">
                      Check your email
                    </h2>
                    <p className="text-zinc-400 text-sm mb-6">
                      We've sent a password reset link to{" "}
                      <span className="text-white font-medium">
                        {forgotPasswordEmail}
                      </span>
                      . Click the link in the email to reset your password.
                    </p>
                    <button
                      onClick={closeForgotPasswordModal}
                      className="w-full bg-indigo-600 text-white text-sm font-medium px-4 py-3 rounded-xl hover:bg-indigo-500 transition-colors"
                    >
                      Got it
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Reset your password
                    </h2>
                    <p className="text-zinc-400 text-sm mb-6">
                      Enter your email address and we'll send you a link to
                      reset your password.
                    </p>

                    {error && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleForgotPassword}>
                      <div className="relative group mb-6">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) =>
                            setForgotPasswordEmail(e.target.value)
                          }
                          className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                          placeholder="Enter your email"
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={closeForgotPasswordModal}
                          className="flex-1 bg-zinc-800/50 text-white text-sm font-medium px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={forgotPasswordLoading}
                          className="flex-1 bg-indigo-600 text-white text-sm font-medium px-4 py-3 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {forgotPasswordLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Send reset link"
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
