import 'dotenv/config';
import { prisma } from '@whatssuite/db';
import { redis } from '@whatssuite/redis';

async function runCampaign(segmentName: string, templateName: string) {
  console.log(`Starting campaign for segment "${segmentName}"...`);

  // 1. Find the segment and include all its contacts
  const segmentWithContacts = await prisma.segment.findUnique({
    where: { name: segmentName },
    include: { contacts: true },
  });

  if (!segmentWithContacts) {
    throw new Error(`Segment "${segmentName}" not found.`);
  }

  const contacts = segmentWithContacts.contacts;
  console.log(`Found ${contacts.length} contacts to message.`);

  // 2. Loop through contacts and publish a job for each one
  for (const contact of contacts) {
    const jobPayload = {
      contactId: contact.id,
      templateName: templateName,
      params: [contact.name], // Personalize with the contact's name
    };

    await redis.publish('message-queue', JSON.stringify(jobPayload));
    console.log(`✅ Queued message for ${contact.name} (${contact.phone})`);
  }

  console.log('Campaign finished. All jobs queued.');
}

// --- Run our test campaign ---
// You can change these values to test different campaigns
runCampaign('VIP Members', 'summer_sale_2025')
  .catch(console.error)
  .finally(async () => {
    // Disconnect clients
    await prisma.$disconnect();
    await redis.quit();
  });
