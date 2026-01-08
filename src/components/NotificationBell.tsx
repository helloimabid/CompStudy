"use client";

import { useState } from "react";
import { Bell, BellOff, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import clsx from "clsx";

export default function NotificationBell() {
  const { isSupported, permissionStatus, enableNotifications } =
    usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      await enableNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  const isEnabled = permissionStatus === "granted";
  const isDenied = permissionStatus === "denied";

  return (
    <div className="relative">
      <button
        onClick={handleEnableNotifications}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={isLoading || isDenied}
        className={clsx(
          "p-2 rounded-lg transition-all relative",
          isEnabled
            ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
            : isDenied
            ? "bg-red-500/10 text-red-400 cursor-not-allowed"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
        )}
        title={
          isEnabled
            ? "Notifications enabled"
            : isDenied
            ? "Notifications blocked - enable in browser settings"
            : "Enable notifications"
        }
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isEnabled ? (
          <Bell size={20} className="fill-current" />
        ) : isDenied ? (
          <BellOff size={20} />
        ) : (
          <Bell size={20} />
        )}

        {/* Status indicator */}
        {isEnabled && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900">
            <Check size={8} className="text-white absolute top-0.5 left-0.5" />
          </span>
        )}
        {isDenied && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900">
            <X size={8} className="text-white absolute top-0.5 left-0.5" />
          </span>
        )}
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 whitespace-nowrap z-50"
          >
            {isEnabled
              ? "Notifications enabled"
              : isDenied
              ? "Blocked - enable in browser settings"
              : "Click to enable notifications"}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-l border-t border-zinc-700 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
