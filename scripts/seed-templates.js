const { PrismaClient } = require('@whatssuite/db');

const prisma = new PrismaClient();

const mockTemplates = [
  {
    name: 'welcome_message',
    content: {
      name: 'welcome_message',
      language: 'en_US',
      category: 'UTILITY',
      status: 'APPROVED',
      components: [
        {
          type: 'HEADER',
          text: 'Welcome to BNI Delhi West!'
        },
        {
          type: 'BODY',
          text: 'Hello {{1}}, welcome to our BNI community! We are excited to have you join us. Your membership number is {{2}}.'
        },
        {
          type: 'FOOTER',
          text: 'Thank you for choosing BNI Delhi West'
        }
      ]
    },
    status: 'APPROVED'
  },
  {
    name: 'meeting_reminder',
    content: {
      name: 'meeting_reminder',
      language: 'en_US',
      category: 'UTILITY',
      status: 'APPROVED',
      components: [
        {
          type: 'HEADER',
          text: 'BNI Meeting Reminder'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, this is a reminder for our BNI meeting tomorrow at {{2}}. Please bring your business cards and be ready to present your 60-second commercial.'
        },
        {
          type: 'FOOTER',
          text: 'Looking forward to seeing you there!'
        }
      ]
    },
    status: 'APPROVED'
  },
  {
    name: 'referral_request',
    content: {
      name: 'referral_request',
      language: 'en_US',
      category: 'MARKETING',
      status: 'PENDING',
      components: [
        {
          type: 'HEADER',
          text: 'Referral Request'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, I hope you are doing well. I am looking for referrals for {{2}} services. If you know anyone who might be interested, please let me know.'
        },
        {
          type: 'FOOTER',
          text: 'Thank you for your support!'
        }
      ]
    },
    status: 'PENDING'
  },
  {
    name: 'event_invitation',
    content: {
      name: 'event_invitation',
      language: 'en_US',
      category: 'MARKETING',
      status: 'APPROVED',
      components: [
        {
          type: 'HEADER',
          text: 'BNI Special Event'
        },
        {
          type: 'BODY',
          text: 'You are invited to our special BNI networking event on {{1}} at {{2}}. This is a great opportunity to expand your network and grow your business.'
        },
        {
          type: 'FOOTER',
          text: 'RSVP required. Limited seats available.'
        }
      ]
    },
    status: 'APPROVED'
  },
  {
    name: 'member_announcement',
    content: {
      name: 'member_announcement',
      language: 'en_US',
      category: 'UTILITY',
      status: 'REJECTED',
      components: [
        {
          type: 'HEADER',
          text: 'New Member Announcement'
        },
        {
          type: 'BODY',
          text: 'Please welcome {{1}} to our BNI chapter! {{1}} specializes in {{2}} and is looking forward to contributing to our community.'
        },
        {
          type: 'FOOTER',
          text: 'Let\'s make them feel welcome!'
        }
      ]
    },
    status: 'REJECTED'
  }
];

async function seedTemplates() {
  try {
    console.log('🌱 Seeding templates...');
    
    for (const template of mockTemplates) {
      await prisma.template.upsert({
        where: { name: template.name },
        update: {
          content: template.content,
          status: template.status,
          updatedAt: new Date()
        },
        create: {
          name: template.name,
          content: template.content,
          status: template.status
        }
      });
      console.log(`✅ Created/Updated template: ${template.name} (${template.status})`);
    }
    
    console.log('🎉 Template seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplates();
