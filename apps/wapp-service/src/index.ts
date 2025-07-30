import "dotenv/config";
import { redis } from "@whatssuite/redis";
import { prisma } from "@whatssuite/db";
import {
  wappClient,
  type SendTemplateMessageArgs,
} from "@whatssuite/wapp-client";

const MESSAGE_QUEUE_CHANNEL = "message-queue";

// This job payload can be simplified if the 'to' field is always fetched from the DB
interface JobPayload {
  // userId: number;
  contactId: string;
  templateName: string;
  params?: string[];
}

async function processJob(jobData: string): Promise<void> {
  try {
    const { contactId, templateName, params }: JobPayload = JSON.parse(jobData);
    console.log(`Processing job for userId: ${contactId}`);

    // Fetch user from the database using Prisma
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { phone: true },
    });

    if (!contact || !contact.phone) {
      throw new Error(`Contact or phone not found for contactId: ${contactId}`);
    }

    // Use the wappClient to send the message
    await wappClient.sendTemplateMessage({
      to: contact.phone,
      templateName,
      bodyParams: params,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to process job:", error.message);
    } else {
      console.error("An unknown error occurred during job processing.");
    }
  }
}

// The startWorker function remains the same

async function startWorker() {
  console.log("Worker is listening for messages...");

  const subscriber = redis.duplicate();
  await subscriber.connect();
  console.log("✅ Redis subscriber client connected.");

  // The listener function where you will process messages.
  const messageListener = (message: string, channel: string) => {
    if (channel === MESSAGE_QUEUE_CHANNEL) {
      console.log(`Received job from ${channel}`);
      processJob(message);
    }
  };

  // Subscribe to the channel and provide the listener function.
  await subscriber.subscribe(MESSAGE_QUEUE_CHANNEL, messageListener);

  console.log(`✅ Subscribed to ${MESSAGE_QUEUE_CHANNEL}. Waiting for jobs...`);
}

startWorker();
