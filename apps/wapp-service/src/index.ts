import "dotenv/config";
import { redis } from "@whatssuite/redis";
import { prisma } from "@whatssuite/db";
import {
  wappClient,
  type SendTemplateMessageArgs,
} from "@whatssuite/wapp-client";

const MESSAGE_QUEUE_CHANNEL = "message-queue";

// Simplified job payload - only phone number needed
interface JobPayload {
  phoneNumber: string; // Required - the phone number to send to
  message?: string; // For text messages
  templateName?: string; // For template messages
  params?: string[];
  buttonParams?: string[];
  imageUrl?: string;
  documentUrl?: string;
  filename?: string;
}

async function processJob(jobData: string): Promise<void> {
  try {
    const {
      phoneNumber,
      message,
      templateName,
      params,
      buttonParams,
      imageUrl,
      documentUrl,
      filename,
    }: JobPayload = JSON.parse(jobData);

    if (!phoneNumber) {
      throw new Error("Phone number is required in job payload");
    }

    console.log(`Processing job for phoneNumber: ${phoneNumber}`);

    // Normalize phone number format
    let normalizedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

    console.log(
      "Parsed job data:",
      JSON.stringify(
        {
          to: normalizedPhone,
          message,
          templateName,
          params,
          buttonParams,
          imageUrl,
          documentUrl,
          filename,
        },
        null,
        2,
      ),
    );

    // Send text message if message is provided, otherwise send template
    if (message) {
      console.log("🚀 Calling wappClient.sendTextMessage...");
      await wappClient.sendTextMessage({
        to: normalizedPhone,
        text: message,
      });
      console.log(`✅ Text message sent successfully to ${normalizedPhone}`);
    } else if (templateName) {
      console.log("🚀 Calling wappClient.sendTemplateMessage...");
      await wappClient.sendTemplateMessage({
        to: normalizedPhone,
        templateName,
        bodyParams: params,
        buttonParams,
        imageUrl,
        documentUrl,
        filename,
      });
      console.log(`✅ Template message sent successfully to ${normalizedPhone} using template ${templateName}`);
    } else {
      throw new Error("Either message or templateName must be provided");
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to process job:", error.message);
    } else {
      console.error("An unknown error occurred during job processing.");
      console.log("Job data:", jobData);
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
