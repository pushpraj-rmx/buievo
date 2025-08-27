import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding contact service database...');

  // Create default segments
  const segments = await Promise.all([
    prisma.segment.upsert({
      where: { name: 'VIP Customers' },
      update: {},
      create: {
        name: 'VIP Customers',
        description: 'High-value customers with premium support',
      },
    }),
    prisma.segment.upsert({
      where: { name: 'New Leads' },
      update: {},
      create: {
        name: 'New Leads',
        description: 'Recently acquired leads',
      },
    }),
    prisma.segment.upsert({
      where: { name: 'Inactive' },
      update: {},
      create: {
        name: 'Inactive',
        description: 'Customers who haven\'t engaged recently',
      },
    }),
  ]);

  console.log('✅ Segments created:', segments.map(s => s.name));

  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { phone: '+1234567890' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        status: 'active',
        comment: 'VIP customer',
        segments: {
          connect: [{ name: 'VIP Customers' }],
        },
      },
    }),
    prisma.contact.upsert({
      where: { phone: '+1987654321' },
      update: {},
      create: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1987654321',
        status: 'active',
        comment: 'New lead from website',
        segments: {
          connect: [{ name: 'New Leads' }],
        },
      },
    }),
    prisma.contact.upsert({
      where: { phone: '+1555123456' },
      update: {},
      create: {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1555123456',
        status: 'inactive',
        comment: 'Haven\'t responded to last 3 messages',
        segments: {
          connect: [{ name: 'Inactive' }],
        },
      },
    }),
  ]);

  console.log('✅ Contacts created:', contacts.map(c => c.name));

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
