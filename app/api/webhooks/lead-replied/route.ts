import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lead_id, profile_url } = body

    if (!lead_id && !profile_url) {
      return NextResponse.json({ error: 'lead_id or profile_url required' }, { status: 400 })
    }

    let lead
    if (lead_id) {
      lead = await prisma.lead.findUnique({ where: { id: lead_id } })
    } else if (profile_url) {
      lead = await prisma.lead.findFirst({ where: { profileUrl: profile_url } })
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'replied',
        repliedAt: new Date(),
      },
    })

    const cancelledSequences = await prisma.outreachSequence.updateMany({
      where: {
        leadId: lead.id,
        status: 'pending',
      },
      data: {
        status: 'cancelled',
        cancelledReason: 'lead_replied',
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: lead.userId,
        leadId: lead.id,
        activityType: 'reply_received',
        description: `Lead replied - cancelled ${cancelledSequences.count} pending follow-ups`,
        metadata: { cancelledFollowups: cancelledSequences.count },
      },
    })

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      cancelled_followups: cancelledSequences.count,
    })
  } catch (error) {
    console.error('Error processing lead replied webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
