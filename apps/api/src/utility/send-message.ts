import "dotenv/config";
import { redis } from "@whatssuite/redis";

// This script sends a message to a single contact by their ID.

async function sendMessage(contactId: string) {
  if (!contactId) {
    console.error("❌ Error: Please provide a contact ID.");
    console.log("Usage: pnpm tsx send-message.ts <contact_id>");
    return;
  }

  console.log(`Queuing message for contact: ${contactId}`);

  // The job payload for the wapp-service
  const jobPayload = {
    contactId: contactId,
    templateName: "hello_world", // Or any other template you want to test
    params: [], // Add params here if your template needs them e.g., ['John']
  };

  // Publish the job to the Redis queue
  await redis.publish("message-queue", JSON.stringify(jobPayload));

  console.log(`✅ Job successfully queued for contactId: ${contactId}`);
}

// Get the contact ID from the command-line arguments
const contactId = process.argv[2];

sendMessage(contactId)
  .catch(console.error)
  .finally(async () => {
    // Disconnect the Redis client
    await redis.quit();
  });
