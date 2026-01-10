"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCUL9CJXpFP4P0WOwpwFefPejrDdZ14_II",
  authDomain: "starter-b22ff.firebaseapp.com",
  projectId: "starter-b22ff",
  storageBucket: "starter-b22ff.appspot.com",
  messagingSenderId: "639564716189",
  appId: "1:639564716189:web:a976ae69f5fa7db2dd5c74",
  measurementId: "G-SDZY08GKPS",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Firebase messaging initialization failed:", error);
  }
}

export { app, messaging };
