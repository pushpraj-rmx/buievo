import { Request, Response } from "express";
import { prisma } from "@whatssuite/db";
import { redis } from "@whatssuite/redis";

export const sendMessageToContact = async (req: Request, res: Response) => {
  // Get the contact ID from the URL parameters
  const { id: contactId } = req.params;
  console.log(`Received request to send message to contactId: ${contactId}`);

  try {
    // Optional: Verify the contact exists before queueing the job
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // The job payload for the wapp-service
    const jobPayload = {
      contactId: contactId,
      templateName: "hello_world", // Or another template from the request body
      params: [], // You could also get these from the request body
    };

    // Publish the job to the Redis queue
    await redis.publish("message-queue", JSON.stringify(jobPayload));
    console.log(`✅ Queued message job for contactId: ${contactId}`);

    // Respond with 202 (Accepted) to indicate the job was queued successfully
    res.status(202).json({ message: "Message queued successfully" });
  } catch (error) {
    console.error("Error queueing message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessageToNumber = async (req: Request, res: Response) => {
  const {
    phoneNumber,
    templateName = "hello_world",
    params = [],
    buttonParams = [],
    imageUrl, // Add support for image URL
    documentUrl, // Add support for document URL
    filename, // Add support for filename
  } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ message: "phoneNumber is required" });
  }

  try {
    // The job payload for the wapp-service
    const jobPayload = {
      phoneNumber,
      templateName,
      params,
      buttonParams,
      imageUrl, // Include imageUrl in the job payload
      documentUrl, // Include documentUrl in the job payload
      filename, // Include filename in the job payload
    };

    // Publish the job to the Redis queue
    await redis.publish("message-queue", JSON.stringify(jobPayload));
    console.log(`✅ Queued message job for phoneNumber: ${phoneNumber}`);

    // Respond with 202 (Accepted) to indicate the job was queued successfully
    res.status(202).json({ message: "Message queued successfully" });
  } catch (error) {
    console.error("Error queueing message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
