import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { startSequenceSchema } from '@/lib/validators'
import { personalizeMessage } from '@/lib/utils'
import { addDays } from 'date-fns'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = startSequenceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const lead = await prisma.lead.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const templates = await prisma.messageTemplate.findMany({
      where: {
        id: { in: parsed.data.templateIds },
        userId: session.user.id,
      },
      orderBy: { stepNumber: 'asc' },
    })

    if (templates.length === 0) {
      return NextResponse.json({ error: 'No valid templates found' }, { status: 400 })
    }

    let scheduledFor = new Date()
    const sequences = []

    for (const template of templates) {
      scheduledFor = addDays(scheduledFor, template.delayDays)

      const personalizedMessage = personalizeMessage(template.body, {
        name: lead.name,
        firstName: lead.firstName,
        company: lead.company,
        headline: lead.headline,
      })

      sequences.push({
        userId: session.user.id,
        leadId: lead.id,
        templateId: template.id,
        stepNumber: template.stepNumber,
        messageContent: personalizedMessage,
        scheduledFor,
        status: 'pending',
      })

      await prisma.messageTemplate.update({
        where: { id: template.id },
        data: { usageCount: { increment: 1 } },
      })
    }

    const createdSequences = await prisma.outreachSequence.createMany({
      data: sequences,
    })

    await prisma.lead.update({
      where: { id },
      data: {
        status: lead.status === 'new' ? 'contacted' : lead.status,
        firstContactedAt: lead.firstContactedAt || new Date(),
        lastContactedAt: new Date(),
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        leadId: id,
        activityType: 'sequence_started',
        description: `Started outreach sequence with ${templates.length} steps`,
        metadata: { templateIds: parsed.data.templateIds },
      },
    })

    return NextResponse.json({
      success: true,
      sequencesCreated: createdSequences.count,
    })
  } catch (error) {
    console.error('Error starting sequence:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
