import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Validate Firebase config
const isFirebaseConfigValid = () => {
  return (
    firebaseConfig.projectId &&
    firebaseConfig.apiKey &&
    firebaseConfig.appId
  );
};

// Initialize Firebase
let app: FirebaseApp | null = null;
if (isFirebaseConfigValid() && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else if (getApps().length > 0) {
  app = getApps()[0];
}

let messaging: Messaging | null = null;

// Get messaging instance (only in browser)
export const getMessagingInstance = () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  
  if (!app) {
    console.error("Firebase app not initialized. Check your environment variables.");
    return null;
  }
  
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (typeof window === "undefined") return null;
    
    if (!isFirebaseConfigValid()) {
      console.error("Firebase configuration is incomplete. Missing required environment variables.");
      return null;
    }

    // Check if VAPID key is present
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("❌ VAPID key is missing. Push notifications will not work without it.");
      console.error("Set NEXT_PUBLIC_FIREBASE_VAPID_KEY in your .env.local file");
      return null;
    }
    
    // Validate VAPID key format (should be base64url, ~87-88 characters)
    if (vapidKey.length < 80 || vapidKey.length > 90) {
      console.error("⚠️ VAPID key length seems unusual:", vapidKey.length, "characters (expected ~87-88)");
      console.error("First 20 chars:", vapidKey.substring(0, 20));
    } else {
      console.log("✅ VAPID key format looks valid:", vapidKey.substring(0, 10) + "..." + vapidKey.substring(vapidKey.length - 5));
    }
    
    // Log Firebase config for debugging
    console.log("🔍 Firebase Config Check:");
    console.log("  Project ID:", firebaseConfig.projectId);
    console.log("  Sender ID:", firebaseConfig.messagingSenderId);
    console.log("  App ID:", firebaseConfig.appId?.substring(0, 20) + "...");

    // Check if notifications are supported
    if (!("Notification" in window)) {
      console.error("This browser does not support notifications");
      return null;
    }

    // Ensure service worker is registered first
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("Service Worker registered successfully");
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("Service Worker is ready");
        
        // Small delay to ensure service worker is fully active
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (swError) {
        console.error("Service Worker registration failed:", swError);
        return null;
      }
    } else {
      console.error("Service workers are not supported in this browser");
      return null;
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const messagingInstance = getMessagingInstance();
    if (!messagingInstance) {
      console.error("Failed to get Firebase messaging instance");
      return null;
    }

    // Get FCM token with retry logic
    let token: string | null = null;
    let retries = 3;
    let lastError: any = null;
    
    while (retries > 0 && !token) {
      try {
        console.log(`Attempting to get FCM token (attempt ${4 - retries}/3)...`);
        
        token = await getToken(messagingInstance, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: await navigator.serviceWorker.ready,
        });
        
        if (token) {
          console.log("✅ FCM Token obtained successfully");
          return token;
        }
      } catch (tokenError: any) {
        lastError = tokenError;
        retries--;
        console.error(`❌ Error getting FCM token (${3 - retries}/3):`, tokenError);
        
        if (tokenError.code === "messaging/permission-blocked") {
          console.error("🚫 Notification permission is blocked. Please enable notifications in browser settings.");
          return null;
        }
        
        if (tokenError.name === "AbortError") {
          console.error("⚠️ Push service registration failed. Possible causes:");
          console.error("   1. VAPID key doesn't match your Firebase project");
          console.error("   2. Firebase Cloud Messaging is not enabled in your project");
          console.error("   3. Service worker Firebase config doesn't match main app config");
          console.error("   4. Browser's push service is temporarily unavailable");
          
          // Don't retry AbortError - it won't help
          console.error("🛑 Stopping retries - AbortError won't resolve with retries");
          break;
        }
        
        if (retries > 0) {
          console.log(`⏳ Waiting 1 second before retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!token) {
      console.error("❌ Failed to obtain FCM token after multiple attempts");
      console.error("Last error:", lastError);
      console.error("\n📋 Troubleshooting Steps:");
      console.error("   1. Enable Firebase Cloud Messaging API:");
      console.error("      → Go to: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=" + firebaseConfig.projectId);
      console.error("      → Click 'ENABLE' if not already enabled");
      console.error("\n   2. Verify VAPID key:");
      console.error("      → Firebase Console → Project Settings → Cloud Messaging → Web Push certificates");
      console.error("      → Your key should match: " + vapidKey.substring(0, 15) + "...");
      console.error("\n   3. Check service worker config:");
      console.error("      → Open /firebase-messaging-sw.js");
      console.error("      → Verify projectId matches: " + firebaseConfig.projectId);
      console.error("\n   4. Clear browser cache and service worker:");
      console.error("      → DevTools → Application → Service Workers → Unregister");
      console.error("      → Hard refresh (Ctrl+Shift+R)");
    }
    
    return token;
  } catch (error: any) {
    console.error("Error getting notification permission:", error);
    
    // Provide more specific error messages
    if (error.name === "AbortError") {
      console.error("Push service registration failed. This may be due to:");
      console.error("1. Missing or invalid VAPID key");
      console.error("2. Service worker not properly configured");
      console.error("3. Browser push service unavailable");
    }
    
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return () => {};

  return onMessage(messagingInstance, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
};

// Show notification in foreground
export const showNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        ...options,
      });
    }
  }
};

export { app };
