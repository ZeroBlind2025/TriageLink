import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create demo user
  const passwordHash = await hash('demo1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@triagelink.com' },
    update: {},
    create: {
      email: 'demo@triagelink.com',
      passwordHash,
      name: 'Demo User',
      settings: {
        create: {
          phantombusterAgentId: 'demo-agent-123',
        },
      },
    },
  })

  console.log(`Created user: ${user.email}`)

  // Create ICP profiles
  const icp1 = await prisma.icpProfile.upsert({
    where: { id: 'icp-saas-founders' },
    update: {},
    create: {
      id: 'icp-saas-founders',
      userId: user.id,
      name: 'SaaS Founders',
      description: 'Founders and CEOs of early-stage SaaS companies',
      keywords: ['SaaS', 'startup', 'funding', 'scaling', 'product-led growth'],
      jobTitles: ['CEO', 'Founder', 'Co-Founder', 'Managing Director'],
      industries: ['SaaS', 'Software', 'Technology'],
      companySizes: ['1-10', '11-50', '51-200'],
      minEngagementScore: 10,
      isActive: true,
    },
  })

  const icp2 = await prisma.icpProfile.upsert({
    where: { id: 'icp-sales-leaders' },
    update: {},
    create: {
      id: 'icp-sales-leaders',
      userId: user.id,
      name: 'Sales Leaders',
      description: 'VPs and Directors of Sales at B2B companies',
      keywords: ['sales', 'revenue', 'pipeline', 'quota', 'outbound'],
      jobTitles: ['VP Sales', 'Sales Director', 'Head of Sales', 'CRO'],
      industries: ['B2B', 'Enterprise Software'],
      companySizes: ['51-200', '201-500', '501-1000'],
      minEngagementScore: 15,
      isActive: true,
    },
  })

  console.log('Created ICP profiles')

  // Create message templates
  const templates = await Promise.all([
    prisma.messageTemplate.upsert({
      where: { id: 'template-connection-1' },
      update: {},
      create: {
        id: 'template-connection-1',
        userId: user.id,
        name: 'Initial Connection Request',
        templateType: 'connection_request',
        body: `Hi {{first_name}},

I came across your recent post about {{company}} and found it really insightful. I'm working on something similar and would love to connect.

Looking forward to learning from your experience!`,
        stepNumber: 1,
        delayDays: 0,
        isActive: true,
      },
    }),
    prisma.messageTemplate.upsert({
      where: { id: 'template-followup-1' },
      update: {},
      create: {
        id: 'template-followup-1',
        userId: user.id,
        name: 'First Follow-up',
        templateType: 'follow_up',
        body: `Hi {{first_name}},

Just wanted to follow up on my connection request. I noticed you're leading growth at {{company}} - I'd love to hear more about your approach.

Would you be open to a quick chat?`,
        stepNumber: 2,
        delayDays: 3,
        isActive: true,
      },
    }),
    prisma.messageTemplate.upsert({
      where: { id: 'template-followup-2' },
      update: {},
      create: {
        id: 'template-followup-2',
        userId: user.id,
        name: 'Second Follow-up',
        templateType: 'follow_up',
        body: `Hey {{first_name}},

I hope this isn't too persistent! I'm genuinely interested in connecting with fellow professionals in the {{company}} space.

No pressure at all - just wanted to give it one more shot. Either way, best of luck with everything!`,
        stepNumber: 3,
        delayDays: 5,
        isActive: true,
      },
    }),
  ])

  console.log(`Created ${templates.length} message templates`)

  // Create sample posts
  const samplePosts = [
    {
      linkedinPostId: 'post-001',
      postContent: `Just closed our Series A! 🚀

After 18 months of grinding, we've raised $5M to scale our platform.

Key learnings:
1. Focus on one thing and do it exceptionally well
2. Talk to 100 customers before building anything
3. Your first 10 customers are your best advisors

What's the best advice you received during your fundraising journey?`,
      authorName: 'Sarah Chen',
      authorProfileUrl: 'https://linkedin.com/in/sarahchen',
      authorHeadline: 'CEO & Co-Founder at TechStartup | Ex-Google',
      authorCompany: 'TechStartup',
      likesCount: 342,
      commentsCount: 87,
      engagementScore: 603,
      matchedIcpId: icp1.id,
    },
    {
      linkedinPostId: 'post-002',
      postContent: `Hot take: Cold outreach isn't dead. Bad cold outreach is dead.

I've booked 47 meetings this month from LinkedIn alone.

Here's what's working:
- Personalization beyond "I saw your profile"
- Actual value upfront (no bait and switch)
- Following up without being annoying

Stop blaming the channel. Fix the message.`,
      authorName: 'Michael Rodriguez',
      authorProfileUrl: 'https://linkedin.com/in/mrodriguez',
      authorHeadline: 'VP Sales at SalesCloud | Helping B2B companies scale',
      authorCompany: 'SalesCloud',
      likesCount: 521,
      commentsCount: 134,
      engagementScore: 923,
      matchedIcpId: icp2.id,
    },
    {
      linkedinPostId: 'post-003',
      postContent: `We just hit $1M ARR!

Started in my garage 2 years ago. Now we're a team of 15.

The biggest lesson? Ship fast, learn faster.

We launched 3 products before finding what worked. Each "failure" taught us something critical about our customers.

What was your biggest pivot?`,
      authorName: 'Emily Watson',
      authorProfileUrl: 'https://linkedin.com/in/emilywatson',
      authorHeadline: 'Founder & CEO at GrowthLabs | Building the future of analytics',
      authorCompany: 'GrowthLabs',
      likesCount: 892,
      commentsCount: 203,
      engagementScore: 1501,
      matchedIcpId: icp1.id,
    },
  ]

  for (const post of samplePosts) {
    await prisma.post.upsert({
      where: {
        userId_linkedinPostId: {
          userId: user.id,
          linkedinPostId: post.linkedinPostId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        ...post,
        postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    })
  }

  console.log(`Created ${samplePosts.length} sample posts`)

  // Create sample leads
  const leads = [
    { name: 'Sarah Chen', company: 'TechStartup', status: 'new', profileUrl: 'https://linkedin.com/in/sarahchen' },
    { name: 'Michael Rodriguez', company: 'SalesCloud', status: 'contacted', profileUrl: 'https://linkedin.com/in/mrodriguez' },
    { name: 'Emily Watson', company: 'GrowthLabs', status: 'replied', profileUrl: 'https://linkedin.com/in/emilywatson' },
    { name: 'James Liu', company: 'StartupXYZ', status: 'new', profileUrl: 'https://linkedin.com/in/jamesliu' },
    { name: 'Amanda Foster', company: 'RevenuePro', status: 'qualified', profileUrl: 'https://linkedin.com/in/amandafoster' },
    { name: 'David Park', company: 'CloudTech', status: 'contacted', profileUrl: 'https://linkedin.com/in/davidpark' },
    { name: 'Lisa Thompson', company: 'DataFlow', status: 'converted', profileUrl: 'https://linkedin.com/in/lisathompson' },
    { name: 'Robert Kim', company: 'AIStartup', status: 'new', profileUrl: 'https://linkedin.com/in/robertkim' },
  ]

  for (const lead of leads) {
    await prisma.lead.upsert({
      where: {
        userId_profileUrl: {
          userId: user.id,
          profileUrl: lead.profileUrl,
        },
      },
      update: {},
      create: {
        userId: user.id,
        name: lead.name,
        firstName: lead.name.split(' ')[0],
        lastName: lead.name.split(' ')[1],
        profileUrl: lead.profileUrl,
        headline: `Leader at ${lead.company}`,
        company: lead.company,
        status: lead.status,
        icpMatchScore: Math.floor(Math.random() * 50) + 50,
        ...(lead.status === 'replied' && { repliedAt: new Date() }),
        ...(lead.status === 'converted' && { convertedAt: new Date() }),
        ...(lead.status !== 'new' && { firstContactedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }),
      },
    })
  }

  console.log(`Created ${leads.length} sample leads`)

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: user.id,
        activityType: 'scrape_completed',
        description: 'Scraped 25 new posts from LinkedIn',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        userId: user.id,
        activityType: 'lead_created',
        description: 'Created lead: Sarah Chen from TechStartup',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        userId: user.id,
        activityType: 'message_sent',
        description: 'Sent connection request to Michael Rodriguez',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  })

  console.log('Created activity logs')
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
