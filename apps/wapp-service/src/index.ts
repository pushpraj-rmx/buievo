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
  contactId?: string;
  phoneNumber?: string;
  templateName: string;
  params?: string[];
  buttonParams?: string[];
}

async function processJob(jobData: string): Promise<void> {
  try {
    const {
      contactId,
      phoneNumber,
      templateName,
      params,
      buttonParams,
    }: JobPayload = JSON.parse(jobData);

    let to: string | undefined;

    if (contactId) {
      console.log(`Processing job for contactId: ${contactId}`);
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { phone: true },
      });
      if (!contact || !contact.phone) {
        throw new Error(
          `Contact or phone not found for contactId: ${contactId}`
        );
      }
      to = contact.phone;
    } else if (phoneNumber) {
      console.log(`Processing job for phoneNumber: ${phoneNumber}`);
      to = phoneNumber;
    } else {
      throw new Error("No contactId or phoneNumber provided in job");
    }

    await wappClient.sendTemplateMessage({
      to,
      templateName,
      bodyParams: params,
      buttonParams,
    });
    console.log(
      "Parsed job data:",
      JSON.stringify({ to, templateName, params, buttonParams }, null, 2)
    );
    console.log(
      `✅ Message sent successfully to ${to} using template ${templateName}`
    );
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
