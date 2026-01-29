import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Users, Query } from "node-appwrite";
import { 
  generateReminderEmailContent, 
  SpacedRepetitionItem 
} from "@/lib/spaced-repetition";



// Alternative endpoint that uses Brevo HTTP API (Edge Runtime compatible)
// Use this if Appwrite Messaging is not configured

const DB_ID = "compstudy-db";
const SPACED_REPETITION_COLLECTION = "spaced_repetition";
const USER_SR_SETTINGS_COLLECTION = "user_sr_settings";
const PROFILES_COLLECTION = "profiles";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface UserSRSettings {
  $id: string;
  userId: string;
  emailRemindersEnabled: boolean;
  reminderTime: string;
  timezone: string;
  maxDailyReviews: number;
  weekendReminders: boolean;
  reminderDaysBefore: number;
}

interface Profile {
  $id: string;
  userId: string;
  username: string;
}

// Send email using Brevo HTTP API
async function sendEmailWithBrevo(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.SMTP_FROM_NAME || "CompStudy",
        email: process.env.SMTP_FROM_EMAIL || "support@compstudy.tech",
      },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${errorData}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Appwrite Admin client
    const client = new Client();
    client
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
      .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY || "");

    const databases = new Databases(client);
    const users = new Users(client);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Get all users with email reminders enabled
    const settingsResponse = await databases.listDocuments(
      DB_ID,
      USER_SR_SETTINGS_COLLECTION,
      [
        Query.equal("emailRemindersEnabled", true),
        Query.limit(100),
      ]
    );

    const userSettings = settingsResponse.documents as unknown as UserSRSettings[];
    const results: { userId: string; sent: boolean; error?: string }[] = [];

    for (const settings of userSettings) {
      try {
        // Skip weekend reminders if disabled
        if (isWeekend && !settings.weekendReminders) {
          results.push({ userId: settings.userId, sent: false, error: "Weekend reminders disabled" });
          continue;
        }

        // Get user's due items
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + settings.reminderDaysBefore);
        
        const dueItemsResponse = await databases.listDocuments(
          DB_ID,
          SPACED_REPETITION_COLLECTION,
          [
            Query.equal("userId", settings.userId),
            Query.equal("status", "active"),
            Query.lessThanEqual("nextReviewDate", dueDate.toISOString()),
            Query.equal("emailReminderSent", false),
            Query.limit(50),
          ]
        );

        const dueItems = dueItemsResponse.documents as unknown as SpacedRepetitionItem[];

        if (dueItems.length === 0) {
          results.push({ userId: settings.userId, sent: false, error: "No items due" });
          continue;
        }

        // Get upcoming items
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        
        const upcomingItemsResponse = await databases.listDocuments(
          DB_ID,
          SPACED_REPETITION_COLLECTION,
          [
            Query.equal("userId", settings.userId),
            Query.equal("status", "active"),
            Query.greaterThan("nextReviewDate", now.toISOString()),
            Query.lessThanEqual("nextReviewDate", weekFromNow.toISOString()),
            Query.limit(20),
          ]
        );

        const upcomingItems = upcomingItemsResponse.documents as unknown as SpacedRepetitionItem[];

        // Get user profile for username
        const profileResponse = await databases.listDocuments(
          DB_ID,
          PROFILES_COLLECTION,
          [Query.equal("userId", settings.userId), Query.limit(1)]
        );

        const profile = profileResponse.documents[0] as unknown as Profile;
        const username = profile?.username || "Student";

        // Get user email
        let userEmail: string;
        try {
          const user = await users.get(settings.userId);
          userEmail = user.email;
          
          if (!userEmail) {
            results.push({ userId: settings.userId, sent: false, error: "No email address" });
            continue;
          }
        } catch (e) {
          results.push({ userId: settings.userId, sent: false, error: "Failed to get user" });
          continue;
        }

        // Generate email content
        const { subject, html, text } = generateReminderEmailContent(
          username,
          dueItems,
          upcomingItems
        );

        // Send email via Brevo HTTP API
        try {
          await sendEmailWithBrevo(userEmail, subject, html, text);

          // Mark items as reminder sent
          for (const item of dueItems) {
            await databases.updateDocument(
              DB_ID,
              SPACED_REPETITION_COLLECTION,
              item.$id,
              { emailReminderSent: true }
            );
          }

          results.push({ userId: settings.userId, sent: true });
        } catch (emailError: any) {
          console.error(`Failed to send email to ${userEmail}:`, emailError);
          results.push({ userId: settings.userId, sent: false, error: emailError.message });
        }
      } catch (userError: any) {
        console.error(`Error processing user ${settings.userId}:`, userError);
        results.push({ userId: settings.userId, sent: false, error: userError.message });
      }
    }

    const sentCount = results.filter(r => r.sent).length;
    const failedCount = results.filter(r => !r.sent).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} reminders via Brevo, ${failedCount} skipped/failed`,
      results,
      processedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Error in send-reminders-smtp:", error);
    return NextResponse.json(
      { error: "Failed to send reminders", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Brevo-based spaced repetition reminder endpoint. Use POST to trigger reminders.",
    timestamp: new Date().toISOString(),
  });
}
