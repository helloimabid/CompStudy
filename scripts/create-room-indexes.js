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

async function createIndexes() {
  try {
    console.log("Creating indexes for Rooms collection...");

    // Create index for roomId for fast lookups
    try {
      await databases.createIndex(
        DB_ID,
        COLLECTION_ID,
        "roomId_index",
        "key",
        ["roomId"],
        ["asc"]
      );
      console.log("✓ Created roomId index");
    } catch (error) {
      if (error.code === 409) {
        console.log("- roomId index already exists");
      } else {
        console.error("Error creating roomId index:", error.message);
      }
    }

    console.log("\n✅ Indexes created successfully!");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
}

createIndexes();
