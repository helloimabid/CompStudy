"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Settings, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useFCM } from "@/hooks/useFCM";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  icon?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"inbox" | "settings">("inbox");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, clearNotifications, fcmToken, requestPermission, permission, registerToken } = useFCM();
  const { user } = useAuth();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[#050505]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900/50">
              <h3 className="font-medium text-sm text-white">Notifications</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={clsx(
                    "p-1.5 rounded-md transition-colors text-xs font-medium",
                    activeTab === "inbox" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Inbox
                </button>
                {/* <button
                  onClick={() => setActiveTab("settings")}
                  className={clsx(
                    "p-1.5 rounded-md transition-colors text-xs font-medium",
                    activeTab === "settings" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Settings
                </button> */}
              </div>
            </div>

            {activeTab === "inbox" ? (
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                      <Bell className="w-5 h-5 text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-400">No notifications yet</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      We'll let you know when something important happens.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={clsx(
                          "p-4 hover:bg-white/5 transition-colors",
                          !notification.read && "bg-indigo-500/5"
                        )}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {notification.icon ? (
                                <img src={notification.icon} alt="" className="w-8 h-8 rounded-full bg-zinc-800 object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                    <Bell className="w-4 h-4 text-indigo-400" />
                                </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-zinc-200 truncate">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                              {notification.body}
                            </p>
                            <span className="text-[10px] text-zinc-600 mt-2 block">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {notifications.length > 0 && (
                    <div className="p-2 border-t border-white/5">
                        <button 
                            onClick={clearNotifications}
                            className="w-full flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 py-2 rounded-md transition-colors"
                        >
                            <Trash2 size={12} />
                            Clear all notifications
                        </button>
                    </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="bg-zinc-900/50 rounded-lg p-3 border border-white/5">
                    <h4 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Status</h4>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-300">Permission</span>
                        <span className={clsx(
                            "text-xs px-2 py-0.5 rounded-full font-medium border",
                            permission === "granted" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            permission === "denied" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        )}>
                            {permission}
                        </span>
                    </div>
                    
                    {permission !== "granted" && (
                        <button 
                            onClick={requestPermission}
                            className="w-full mt-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-md transition-colors"
                        >
                            Enable Notifications
                        </button>
                    )}
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-3 border border-white/5">
                    <h4 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Troubleshooting</h4>
                    <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                        If you are not receiving notifications or see "0 targets" in Appwrite:
                    </p>
                    
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className={clsx("w-3.5 h-3.5 mt-0.5 flex-shrink-0", fcmToken ? "text-emerald-400" : "text-zinc-600")} />
                            <div>
                                <span className="text-xs text-zinc-300">FCM Token Generated</span>
                                {!fcmToken && permission === "granted" && (
                                    <button onClick={registerToken} className="ml-2 text-[10px] text-indigo-400 hover:underline">Retry</button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-zinc-500" />
                            <div>
                                <span className="text-xs text-zinc-300">Provider ID Check</span>
                                <p className="text-[10px] text-zinc-500 mt-0.5">
                                    Ensure your Appwrite FCM provider is named <code>fcm</code> (lowercase). If named differently, contact support.
                                </p>
                            </div>
                        </div>
                    </div>

                    {fcmToken && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-[10px] text-zinc-600 font-mono break-all bg-black/20 p-2 rounded">
                                {fcmToken.slice(0, 20)}...{fcmToken.slice(-20)}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-1">
                                Token ID for debugging
                            </p>
                        </div>
                    )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
