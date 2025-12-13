import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sequence_id, lead_id, personalized_message, profile_url } = body

    if (!sequence_id) {
      return NextResponse.json({ error: 'sequence_id required' }, { status: 400 })
    }

    const sequence = await prisma.outreachSequence.findUnique({
      where: { id: sequence_id },
      include: { lead: true, template: true },
    })

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    if (sequence.lead.status === 'replied' || sequence.lead.status === 'opted_out') {
      await prisma.outreachSequence.update({
        where: { id: sequence_id },
        data: {
          status: 'cancelled',
          cancelledReason: `lead_${sequence.lead.status}`,
        },
      })

      return NextResponse.json({
        success: false,
        reason: `Lead has status: ${sequence.lead.status}`,
        skipped: true,
      })
    }

    await prisma.outreachSequence.update({
      where: { id: sequence_id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    })

    await prisma.lead.update({
      where: { id: sequence.leadId },
      data: {
        lastContactedAt: new Date(),
        status: sequence.lead.status === 'new' ? 'contacted' : sequence.lead.status,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: sequence.userId,
        leadId: sequence.leadId,
        activityType: 'message_sent',
        description: `Sent ${sequence.template?.templateType || 'message'} - Step ${sequence.stepNumber}`,
        metadata: {
          sequenceId: sequence_id,
          templateId: sequence.templateId,
          stepNumber: sequence.stepNumber,
        },
      },
    })

    return NextResponse.json({
      success: true,
      sequence_id,
      lead_id: sequence.leadId,
      message_content: personalized_message || sequence.messageContent,
      profile_url: profile_url || sequence.lead.profileUrl,
    })
  } catch (error) {
    console.error('Error processing send outreach webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
