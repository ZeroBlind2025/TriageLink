import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const webhookSecret = request.headers.get('x-webhook-secret')
    const body = await request.json()

    const { leads, userId, timestamp } = body

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    let targetUserId = userId

    if (!targetUserId && webhookSecret) {
      const settings = await prisma.userSettings.findFirst({
        where: {
          settingsJson: {
            path: ['webhookSecret'],
            equals: webhookSecret,
          },
        },
        include: { user: true },
      })
      if (settings) {
        targetUserId = settings.userId
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User not identified' }, { status: 401 })
    }

    const createdLeads = await Promise.all(
      leads.map(async (lead: Record<string, unknown>) => {
        try {
          return await prisma.lead.upsert({
            where: {
              userId_profileUrl: {
                userId: targetUserId,
                profileUrl: (lead.profile_url || lead.profileUrl) as string,
              },
            },
            update: {
              name: lead.name as string | undefined,
              headline: lead.headline as string | undefined,
              company: lead.company as string | undefined,
            },
            create: {
              userId: targetUserId,
              name: lead.name as string | undefined,
              profileUrl: (lead.profile_url || lead.profileUrl) as string,
              headline: lead.headline as string | undefined,
              company: lead.company as string | undefined,
              sourceType: 'webhook',
            },
          })
        } catch {
          return null
        }
      })
    )

    const successfulLeads = createdLeads.filter(Boolean)

    await prisma.activityLog.create({
      data: {
        userId: targetUserId,
        activityType: 'webhook_new_leads',
        description: `Received ${successfulLeads.length} leads via webhook`,
        metadata: { timestamp, count: successfulLeads.length },
      },
    })

    return NextResponse.json({
      success: true,
      leadsCreated: successfulLeads.length,
    })
  } catch (error) {
    console.error('Error processing new leads webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
