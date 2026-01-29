import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query, ID } from "node-appwrite";
import { calculateNextReview, ReviewQuality } from "@/lib/spaced-repetition";



const DB_ID = "compstudy-db";
const SPACED_REPETITION_COLLECTION = "spaced_repetition";

// Submit a review for a spaced repetition item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, quality, userId } = body;

    if (!itemId || quality === undefined || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: itemId, quality, userId" },
        { status: 400 }
      );
    }

    if (quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: "Quality must be between 0 and 5" },
        { status: 400 }
      );
    }

    // Initialize Appwrite Admin client
    const client = new Client();
    client
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
      .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY || "");

    const databases = new Databases(client);

    // Get the current item
    const item = await databases.getDocument(
      DB_ID,
      SPACED_REPETITION_COLLECTION,
      itemId
    );

    // Verify ownership
    if (item.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Calculate new scheduling parameters
    const result = calculateNextReview(
      item.easeFactor || 2.5,
      item.interval || 1,
      item.repetitions || 0,
      quality as ReviewQuality
    );

    // Update the item
    const isCorrect = quality >= 3;
    const updatedItem = await databases.updateDocument(
      DB_ID,
      SPACED_REPETITION_COLLECTION,
      itemId,
      {
        easeFactor: result.newEaseFactor,
        interval: result.newInterval,
        repetitions: result.newRepetitions,
        nextReviewDate: result.nextReviewDate.toISOString(),
        lastReviewDate: new Date().toISOString(),
        totalReviews: (item.totalReviews || 0) + 1,
        correctReviews: (item.correctReviews || 0) + (isCorrect ? 1 : 0),
        emailReminderSent: false, // Reset for next review cycle
      }
    );

    return NextResponse.json({
      success: true,
      item: updatedItem,
      nextReview: result.nextReviewDate.toISOString(),
      interval: result.newInterval,
    });
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review", details: error.message },
      { status: 500 }
    );
  }
}
