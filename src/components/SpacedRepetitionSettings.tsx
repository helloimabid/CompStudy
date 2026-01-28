"use client";

import { useState, useEffect } from "react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Query, ID, Permission, Role } from "appwrite";
import {
  DEFAULT_SR_SETTINGS,
  UserSRSettings,
  PRESET_PATTERNS,
  parseCustomIntervals,
  ReviewMode,
} from "@/lib/spaced-repetition";
import clsx from "clsx";
import {
  Clock,
  Mail,
  Calendar,
  Bell,
  Save,
  Loader2,
  Repeat,
  Zap,
  Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SpacedRepetitionSettingsProps {
  onSettingsChange?: (settings: UserSRSettings) => void;
}

const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  { value: "Asia/Dhaka", label: "Bangladesh Standard Time (BST)" },
];

export default function SpacedRepetitionSettings({
  onSettingsChange,
}: SpacedRepetitionSettingsProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSRSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [timezone, setTimezone] = useState("UTC");
  const [maxDailyReviews, setMaxDailyReviews] = useState(20);
  const [weekendReminders, setWeekendReminders] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(0);

  // Pattern settings
  const [reviewMode, setReviewMode] = useState<ReviewMode>("custom");
  const [selectedPatternId, setSelectedPatternId] = useState("standard");
  const [customIntervalsInput, setCustomIntervalsInput] =
    useState("1,4,7,14,30");

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.USER_SR_SETTINGS,
        [Query.equal("userId", user.$id), Query.limit(1)],
      );

      if (response.documents.length > 0) {
        const existingSettings = response
          .documents[0] as unknown as UserSRSettings;
        setSettings(existingSettings);
        setEmailRemindersEnabled(existingSettings.emailRemindersEnabled);
        setReminderTime(existingSettings.reminderTime);
        setTimezone(existingSettings.timezone);
        setMaxDailyReviews(existingSettings.maxDailyReviews);
        setWeekendReminders(existingSettings.weekendReminders);
        setReminderDaysBefore(existingSettings.reminderDaysBefore);
        // Pattern settings
        setReviewMode(existingSettings.reviewMode || "custom");
        setSelectedPatternId(existingSettings.selectedPatternId || "standard");
        if (existingSettings.customIntervals) {
          try {
            const intervals = JSON.parse(existingSettings.customIntervals);
            setCustomIntervalsInput(intervals.join(","));
          } catch {
            setCustomIntervalsInput("1,4,7,14,30");
          }
        }
      } else {
        // Use default settings
        setEmailRemindersEnabled(DEFAULT_SR_SETTINGS.emailRemindersEnabled);
        setReminderTime(DEFAULT_SR_SETTINGS.reminderTime);
        setTimezone(DEFAULT_SR_SETTINGS.timezone);
        setMaxDailyReviews(DEFAULT_SR_SETTINGS.maxDailyReviews);
        setWeekendReminders(DEFAULT_SR_SETTINGS.weekendReminders);
        setReminderDaysBefore(DEFAULT_SR_SETTINGS.reminderDaysBefore);
        setReviewMode(DEFAULT_SR_SETTINGS.reviewMode || "custom");
        setSelectedPatternId(
          DEFAULT_SR_SETTINGS.selectedPatternId || "standard",
        );
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setMessage(null);

      // Validate custom intervals if using custom pattern
      let customIntervalsJson = DEFAULT_SR_SETTINGS.customIntervals;
      if (selectedPatternId === "custom") {
        const parsedIntervals = parseCustomIntervals(customIntervalsInput);
        if (parsedIntervals.length === 0) {
          setMessage({
            type: "error",
            text: "Please enter valid intervals (e.g., 1,4,7,14,30)",
          });
          setSaving(false);
          return;
        }
        customIntervalsJson = JSON.stringify(parsedIntervals);
      } else {
        const pattern = PRESET_PATTERNS.find((p) => p.id === selectedPatternId);
        customIntervalsJson = JSON.stringify(
          pattern?.intervals || [1, 4, 7, 14, 30],
        );
      }

      const settingsData = {
        userId: user.$id,
        emailRemindersEnabled,
        reminderTime,
        timezone,
        maxDailyReviews,
        weekendReminders,
        reminderDaysBefore,
        reviewMode,
        selectedPatternId,
        customIntervals: customIntervalsJson,
      };

      let savedSettings: UserSRSettings;

      if (settings) {
        const response = await databases.updateDocument(
          DB_ID,
          COLLECTIONS.USER_SR_SETTINGS,
          settings.$id,
          settingsData,
        );
        savedSettings = response as unknown as UserSRSettings;
      } else {
        const response = await databases.createDocument(
          DB_ID,
          COLLECTIONS.USER_SR_SETTINGS,
          ID.unique(),
          settingsData,
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ],
        );
        savedSettings = response as unknown as UserSRSettings;
      }

      setSettings(savedSettings);
      setMessage({ type: "success", text: "Settings saved successfully!" });
      onSettingsChange?.(savedSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const selectedPattern = PRESET_PATTERNS.find(
    (p) => p.id === selectedPatternId,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Pattern Settings */}
      <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/5 backdrop-blur-sm">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Repeat className="w-5 h-5 text-indigo-400" />
          Review Pattern
        </h3>

        <div className="space-y-6">
          {/* Review Mode Selection */}
          <div className="space-y-3">
            <label className="block text-zinc-400 font-medium mb-2">Review Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setReviewMode("custom")}
                className={clsx(
                  "p-5 rounded-2xl border text-left transition-all relative overflow-hidden group",
                  reviewMode === "custom"
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className={clsx("p-2 rounded-lg transition-colors", reviewMode === "custom" ? "bg-indigo-500/20" : "bg-white/5")}>
                    <Calendar className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-white font-medium text-lg">
                    Fixed Intervals
                  </span>
                </div>
                <p className="text-sm text-zinc-400 relative z-10 pl-[52px]">
                  Review at set intervals (e.g., 1-4-7-14 days). Simple and
                  predictable.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReviewMode("sm2")}
                className={clsx(
                  "p-5 rounded-2xl border text-left transition-all relative overflow-hidden group",
                  reviewMode === "sm2"
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className={clsx("p-2 rounded-lg transition-colors", reviewMode === "sm2" ? "bg-yellow-500/20" : "bg-white/5")}>
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-white font-medium text-lg">SM-2 Algorithm</span>
                </div>
                <p className="text-sm text-zinc-400 relative z-10 pl-[52px]">
                  Adaptive intervals based on your performance. More efficient
                  long-term.
                </p>
              </button>
            </div>
          </div>

          {/* Pattern Selection (for custom mode) */}
          {reviewMode === "custom" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-4 border-t border-white/5"
            >
              <div className="space-y-3">
                <label className="block text-zinc-400 font-medium mb-2">
                  Select Pattern
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {PRESET_PATTERNS.map((pattern) => (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatternId(pattern.id);
                        if (pattern.id !== "custom") {
                          setCustomIntervalsInput(pattern.intervals.join(","));
                        }
                      }}
                      className={clsx(
                        "p-4 rounded-xl border text-left transition-all",
                        selectedPatternId === pattern.id
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium mb-1">
                            {pattern.name}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {pattern.description}
                          </p>
                        </div>
                        <div className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded">
                          {pattern.id === "custom"
                            ? "Custom"
                            : pattern.intervals.slice(0, 5).join(" → ")}
                          {pattern.intervals.length > 5 ? "..." : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Intervals Input */}
              {selectedPatternId === "custom" && (
                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 text-zinc-400 font-medium">
                    <Edit3 className="w-4 h-4" />
                    Custom Intervals (days)
                  </label>
                  <input
                    type="text"
                    value={customIntervalsInput}
                    onChange={(e) => setCustomIntervalsInput(e.target.value)}
                    placeholder="e.g., 1,3,7,14,30,60"
                    aria-label="Custom intervals in days"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-white/20"
                  />
                  <p className="text-xs text-zinc-500">
                    Enter comma-separated numbers. Each number is days until
                    next review.
                  </p>
                  {customIntervalsInput && (
                    <div className="flex items-center gap-2 flex-wrap mt-2 bg-black/20 p-3 rounded-lg border border-white/5">
                      <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Preview:</span>
                      {parseCustomIntervals(customIntervalsInput).map(
                        (day, i, arr) => (
                          <span key={i} className="text-xs flex items-center">
                            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20">
                              {day}d
                            </span>
                            {i < arr.length - 1 && (
                              <span className="text-zinc-600 mx-1">→</span>
                            )}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Pattern Preview */}
              {selectedPattern && selectedPatternId !== "custom" && (
                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
                    Review Schedule Preview
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedPattern.intervals.map((day, i, arr) => (
                      <span key={i} className="text-sm flex items-center">
                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20">
                          Day {day}
                        </span>
                        {i < arr.length - 1 && (
                          <span className="text-zinc-600 mx-1">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Email Reminder Settings */}
      <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/5 backdrop-blur-sm">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          Email Reminders
        </h3>

        <div className="space-y-6">
          {/* Email Reminders Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-medium">Email Reminders</p>
                <p className="text-sm text-zinc-400">
                  Receive notifications when topics are due
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailRemindersEnabled}
                onChange={(e) => setEmailRemindersEnabled(e.target.checked)}
                className="sr-only peer"
                aria-label="Enable email reminders"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <AnimatePresence>
          {emailRemindersEnabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden"
            >
              {/* Reminder Time */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Reminder Time</p>
                    <p className="text-sm text-zinc-500">
                      Daily notification time
                    </p>
                  </div>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  aria-label="Reminder time"
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <label className="block text-zinc-400 font-medium">Timezone</label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    aria-label="Select timezone"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value} className="bg-zinc-900 text-white">
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Weekend Reminders */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Weekend Reminders</p>
                    <p className="text-sm text-zinc-500">
                      Include Saturday & Sunday
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weekendReminders}
                    onChange={(e) => setWeekendReminders(e.target.checked)}
                    className="sr-only peer"
                    aria-label="Enable weekend reminders"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Max Daily Reviews */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-white font-medium">
                  Max Daily Reviews
                </label>
                <p className="text-sm text-zinc-500">
                  Daily limit for review sessions
                </p>
              </div>
              <span className="bg-white/10 text-white px-3 py-1 rounded-lg font-mono">
                {maxDailyReviews}
              </span>
            </div>
            <input
              type="range"
              value={maxDailyReviews}
              onChange={(e) =>
                setMaxDailyReviews(
                  Math.max(1, Math.min(100, Number(e.target.value))),
                )
              }
              min={1}
              max={100}
              aria-label="Maximum daily reviews"
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 font-mono">
              <span>1</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={clsx(
            "p-4 rounded-xl text-sm flex items-center justify-center font-medium shadow-lg backdrop-blur-sm",
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20",
          )}
        >
          {message.text}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className={clsx(
          "w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold transition-all shadow-xl hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 active:translate-y-0",
          saving
            ? "bg-zinc-700 cursor-not-allowed text-zinc-400"
            : "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02]"
        )}
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving Changes...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Profile
          </>
        )}
      </button>
    </div>
  );
}
