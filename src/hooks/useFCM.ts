"use client";

import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging as firebaseMessaging } from "@/lib/firebase";
import { ID } from "appwrite";
import { account, messaging as appwriteMessaging } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";

// You can move this to a shared config if needed
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ""; // Optional for FCM but recommended

export interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  icon?: string;
}

export function useFCM() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    "default"
  );
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  // Load notifications from local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("notifications");
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse notifications", e);
        }
      }
    }
  }, []);

  // Save notifications to local storage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined") return;
    
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        await registerToken();
      } else {
        console.log("Notification permission denied");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const registerToken = async () => {
    if (!firebaseMessaging || !user) return;

    try {
      const token = await getToken(firebaseMessaging, {
        vapidKey: VAPID_KEY || undefined,
      });

      if (token) {
        setFcmToken(token);
        console.log("FCM Token:", token);
        
        // Register token with Appwrite
        // Note: You need to set up the FCM Provider in Appwrite Console and get the Provider ID.
        // Assuming 'fcm' is the provider ID or passed via env.
        const providerId = process.env.NEXT_PUBLIC_APPWRITE_FCM_PROVIDER_ID || 'expo'; 
        
        try {
            // Check if we already have a target for this token?
            // Appwrite createPushTarget throws if duplicate? 
            // Actually, we usually just try to create it.
            
            // NOTE: Appwrite Client SDK 'account.createPushTarget' attaches it to the current user.
            await account.createPushTarget(
                ID.unique(), // targetId
                token, // identifier (FCM token)
                providerId // providerId
            );
            console.log("Appwrite Push Target created");
        } catch (error: any) {
            // Ignore if already exists (409)
            if (error.code !== 409) {
                console.error("Error creating Appwrite push target:", error);
            } else {
                console.log("Appwrite Push Target already exists");
            }
        }
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!firebaseMessaging) return;

    const unsubscribe = onMessage(firebaseMessaging, (payload) => {
      console.log("Foreground Message received:", payload);
      
      const { title, body, icon } = payload.notification || {};
      
      const newNotification: NotificationMessage = {
        id: Date.now().toString(),
        title: title || "New Message",
        body: body || "",
        timestamp: Date.now(),
        read: false,
        icon: icon || undefined,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      // Show toast or custom UI
      // Using browser Notification API if document is hidden, otherwise Toast
      if (Notification.permission === "granted") {
         new Notification(title || "New Message", {
             body,
             icon: icon || "/icons/icon-192x192.png",
         });
      } else {
          // Fallback if no permission or toast library
          console.log(`${title}: ${body}`); 
      }
    });

    return () => unsubscribe();
  }, [firebaseMessaging]);

  return { permission, requestPermission, fcmToken, notifications, clearNotifications, registerToken };
}
