"use client";

import { useState } from "react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { ID, Permission, Role } from "appwrite";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  User,
  AtSign,
  HelpCircle,
  Bug,
  Lightbulb,
  Shield,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const SUBJECT_OPTIONS = [
  { value: "general", label: "General Inquiry", icon: HelpCircle },
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature Request", icon: Lightbulb },
  { value: "account", label: "Account Issue", icon: Shield },
  { value: "other", label: "Other", icon: MessageSquare },
];

export default function ContactPage() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.CONTACT_SUBMISSIONS,
        ID.unique(),
        {
          name,
          email,
          subject,
          message,
          status: "new",
          submittedAt: new Date().toISOString(),
          userId: user?.$id || null,
        },
        [Permission.read(Role.any())]
      );

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-medium text-white mb-4">
              Message Sent!
            </h1>
            <p className="text-zinc-500 mb-8 max-w-md mx-auto">
              Thank you for reaching out. We'll get back to you as soon as
              possible, usually within 24-48 hours.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 text-black rounded-xl hover:bg-zinc-200 transition-all text-sm font-medium"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 lg:pb-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-zinc-900/80 border border-white/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight mb-4 md:mb-6">
            Get in <span className="text-gradient">Touch</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 max-w-2xl mx-auto">
            Have a question, suggestion, or found a bug? We'd love to hear from
            you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Why Contact Us?
              </h3>
              <div className="space-y-4">
                {SUBJECT_OPTIONS.slice(0, 4).map((option) => (
                  <div key={option.value} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                      <option.icon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {option.label}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {option.value === "general" &&
                          "Questions about CompStudy or how to use it"}
                        {option.value === "bug" &&
                          "Something not working correctly?"}
                        {option.value === "feature" &&
                          "Ideas to make CompStudy better"}
                        {option.value === "account" &&
                          "Login issues or account problems"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <h3 className="text-lg font-medium text-white mb-2">
                Response Time
              </h3>
              <p className="text-sm text-zinc-500">
                We typically respond within 24-48 hours. For urgent issues,
                please mention it in your message.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 md:p-8"
            >
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="john@example.com"
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Subject
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SUBJECT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSubject(option.value)}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                          subject === option.value
                            ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        )}
                      >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Message
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder="Tell us what's on your mind..."
                      className="w-full bg-zinc-900/50 border border-zinc-800 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !subject}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-medium px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
