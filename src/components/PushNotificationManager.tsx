"use client";

import { useFCM } from "@/hooks/useFCM";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PushNotificationManager() {
  const { permission, requestPermission } = useFCM();
  const { user } = useAuth();

  useEffect(() => {
    // Automatically request permission if user is logged in and not denied?
    // Or just let them click the button.
    // Usually better to let them click or show a prompt.
    // For now, we will just have the hook ready.
  }, [user]);

  if (!user) return null;
  if (permission === "granted") return null; // Hide if already granted

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {permission === "default" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-lg max-w-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Enable Notifications</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Get updates on new announcements and messages.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                // Dismiss logic if needed
              }}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 px-3 py-1.5"
            >
              Later
            </button>
            <button
              onClick={() => requestPermission()}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              Enable
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
