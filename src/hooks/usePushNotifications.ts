"use client";

import { useEffect, useState, useCallback } from "react";
import {
  requestNotificationPermission,
  onForegroundMessage,
  showNotification,
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);

  // Check if notifications are supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported("Notification" in window && "serviceWorker" in navigator);
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  // Save FCM token to Appwrite
  const saveTokenToDatabase = useCallback(
    async (token: string) => {
      if (!user) return;

      try {
        // Check if token already exists for this user
        const existing = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.FCM_TOKENS,
          [Query.equal("userId", user.$id), Query.equal("token", token)]
        );

        if (existing.documents.length === 0) {
          // Save new token
          await databases.createDocument(
            DB_ID,
            COLLECTIONS.FCM_TOKENS,
            ID.unique(),
            {
              userId: user.$id,
              token: token,
              createdAt: new Date().toISOString(),
              platform: "web",
              userAgent: navigator.userAgent,
            }
          );
          console.log("FCM token saved to database");
        }
      } catch (error) {
        console.error("Error saving FCM token:", error);
      }
    },
    [user]
  );

  // Request permission and get token
  const enableNotifications = useCallback(async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setPermissionStatus("granted");
        await saveTokenToDatabase(token);
        return token;
      }
      return null;
    } catch (error) {
      console.error("Error enabling notifications:", error);
      return null;
    }
  }, [saveTokenToDatabase]);

  // Listen for foreground messages
  useEffect(() => {
    if (!fcmToken) return;

    const unsubscribe = onForegroundMessage((payload: NotificationPayload) => {
      // Show notification when app is in foreground
      showNotification(
        payload.notification?.title || "CompStudy",
        {
          body: payload.notification?.body,
          data: payload.data,
        }
      );
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [fcmToken]);

  return {
    fcmToken,
    isSupported,
    permissionStatus,
    enableNotifications,
  };
}
