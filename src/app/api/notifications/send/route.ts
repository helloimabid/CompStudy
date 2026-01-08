import { NextRequest, NextResponse } from "next/server";

// Firebase Cloud Messaging via HTTP v1 API
// Uses Web Crypto API for Edge runtime compatibility

export const runtime = "edge";

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}

interface SendNotificationRequest {
  tokens: string[]; // FCM tokens
  notification: NotificationPayload;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationRequest = await request.json();
    const { tokens, notification } = body;

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: "No tokens provided" },
        { status: 400 }
      );
    }

    // For now, we'll use Firebase HTTP v1 API directly
    // This requires a service account key
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.error("Firebase service account key not configured");
      return NextResponse.json(
        { error: "Push notifications not configured" },
        { status: 500 }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Get access token using service account
    const accessToken = await getAccessToken(serviceAccount);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 500 }
      );
    }

    const projectId = serviceAccount.project_id;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        const message = {
          message: {
            token: token,
            notification: {
              title: notification.title,
              body: notification.body,
            },
            webpush: {
              notification: {
                icon: notification.icon || "/icons/icon-192x192.png",
                badge: "/icons/icon-72x72.png",
                vibrate: [200, 100, 200],
                requireInteraction: true,
              },
              fcm_options: {
                link: notification.data?.url || "/",
              },
            },
            data: notification.data || {},
          },
        };

        const response = await fetch(fcmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }

        return await response.json();
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed,
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

// Get OAuth2 access token for Firebase
async function getAccessToken(serviceAccount: any): Promise<string | null> {
  try {
    const jwt = await createJWT(serviceAccount);
    
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get access token");
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

// Create JWT for service account authentication using Web Crypto API
async function createJWT(serviceAccount: any): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Sign using Web Crypto API
  const privateKey = serviceAccount.private_key;
  const signature = await signWithWebCrypto(signatureInput, privateKey);

  return `${signatureInput}.${signature}`;
}

function base64UrlEncode(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Convert PEM to ArrayBuffer for Web Crypto
function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Remove PEM headers and newlines
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "")
    .replace(/\r/g, "")
    .replace(/\s/g, "");
  
  // Decode base64
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function signWithWebCrypto(data: string, privateKeyPem: string): Promise<string> {
  // Import the private key
  const keyData = pemToArrayBuffer(privateKeyPem);
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"]
  );

  // Sign the data
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    dataBuffer
  );

  return arrayBufferToBase64Url(signature);
}
