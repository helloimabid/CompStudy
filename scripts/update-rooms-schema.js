const sdk = require("node-appwrite");

const client = new sdk.Client();
const databases = new sdk.Databases(client);

client
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("6955d513000fca8bf0d3")
  .setKey(
    "standard_da39ec3c3df2312f77974919569e99f48c45912c29db9cc7111ce117a7a57b427cbd6e9a83751d5108fb2f93f4029b064b7b2a3a0130d279360fe036b6bb3612826218947953e25bad289c6993af9faeeeb7dedafb319840dcababc2f8cc0ad8b0401ddb2f29f9a6f44b6741ad3c1471286f6e8d60b5a3f28f255fadb1448d6d"
  );

const DB_ID = "compstudy-db";
const COLLECTION_ID = "rooms";

async function updateRoomsSchema() {
  try {
    console.log("Updating Rooms collection schema...");

    // Add name attribute (room display name)
    try {
      await databases.createStringAttribute(
        DB_ID,
        COLLECTION_ID,
        "name",
        100,
        true
      );
      console.log("✓ Added name attribute");
    } catch (error) {
      if (error.code === 409) {
        console.log("- name already exists");
      } else {
        console.error("Error adding name:", error.message);
      }
    }

    // Add roomId attribute (the code users share to join)
    try {
      await databases.createStringAttribute(
        DB_ID,
        COLLECTION_ID,
        "roomId",
        50,
        true
      );
      console.log("✓ Added roomId attribute");
    } catch (error) {
      if (error.code === 409) {
        console.log("- roomId already exists");
      } else {
        console.error("Error adding roomId:", error.message);
      }
    }

    // Add creatorId attribute
    try {
      await databases.createStringAttribute(
        DB_ID,
        COLLECTION_ID,
        "creatorId",
        100,
        true
      );
      console.log("✓ Added creatorId attribute");
    } catch (error) {
      if (error.code === 409) {
        console.log("- creatorId already exists");
      } else {
        console.error("Error adding creatorId:", error.message);
      }
    }

    // Add participants attribute (JSON array of participant objects)
    try {
      await databases.createStringAttribute(
        DB_ID,
        COLLECTION_ID,
        "participants",
        10000,
        true
      );
      console.log("✓ Added participants attribute");
    } catch (error) {
      if (error.code === 409) {
        console.log("- participants already exists");
      } else {
        console.error("Error adding participants:", error.message);
      }
    }

    // Add timerState attribute
    try {
      await databases.createEnumAttribute(
        DB_ID,
        COLLECTION_ID,
        "timerState",
        ["idle", "running", "paused"],
        true
      );
      console.log("✓ Added timerState attribute");
    } catch (error) {
      if (error.code === 409) {
        console.log("- timerState already exists");
      } else {
        console.error("Error adding timerState:", error.message);
      }
    }

    // Add timeRemaining attribute (in seconds)
    try {
      await databases.createIntegerAttribute(
        DB_ID,
        COLLECTION_ID,
        "timeRemaining",
        true
      );
      console.log("✓ Added timeRemaining attribute");
    } catch (error) {
      if (error.code === 409) {
        console.log("- timeRemaining already exists");
      } else {
        console.error("Error adding timeRemaining:", error.message);
      }
    }

    // Add mode attribute
    try {
      await databases.createEnumAttribute(
        DB_ID,
        COLLECTION_ID,
        "mode",
        ["pomodoro", "short-break", "long-break"],
        true
      );
      console.log("✓ Added mode attribute");
    } catch (error) {
      if (error.code === 409) {
        console.log("- mode already exists");
      } else {
        console.error("Error adding mode:", error.message);
      }
    }

    console.log("\n✅ Rooms collection schema update complete!");
    console.log(
      "\nNote: Wait a few seconds for attributes to be available before testing."
    );
  } catch (error) {
    console.error("Error updating schema:", error);
  }
}

updateRoomsSchema();
