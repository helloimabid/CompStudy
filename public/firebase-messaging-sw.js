// Firebase Messaging Service Worker
// This file MUST be in the public folder

importScripts(
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCUL9CJXpFP4P0WOwpwFefPejrDdZ14_II",
  authDomain: "starter-b22ff.firebaseapp.com",
  projectId: "starter-b22ff",
  storageBucket: "starter-b22ff.appspot.com",
  messagingSenderId: "639564716189",
  appId: "1:639564716189:web:a976ae69f5fa7db2dd5c74",
  measurementId: "G-SDZY08GKPS",
});

const messaging = firebase.messaging();

// Suppress errors for proper service worker operation
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload
  );

  const notificationTitle = payload.notification?.title || "CompStudy";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: payload.data?.tag || "default",
    data: payload.data,
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click:", event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if (event.notification.data?.url) {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
