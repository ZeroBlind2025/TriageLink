import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { leadUpdateSchema } from '@/lib/validators'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const lead = await prisma.lead.findFirst({
      where: { id, userId: session.user.id },
      include: {
        sourcePost: true,
        outreachSequences: {
          include: { template: true },
          orderBy: { createdAt: 'desc' },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = leadUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const lead = await prisma.lead.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    if (parsed.data.status === 'replied' && !lead.repliedAt) {
      updateData.repliedAt = new Date()
    }
    if (parsed.data.status === 'converted' && !lead.convertedAt) {
      updateData.convertedAt = new Date()
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: updateData,
    })

    if (parsed.data.status && parsed.data.status !== lead.status) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          leadId: id,
          activityType: 'status_changed',
          description: `Status changed from ${lead.status} to ${parsed.data.status}`,
          metadata: { oldStatus: lead.status, newStatus: parsed.data.status },
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const lead = await prisma.lead.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    await prisma.lead.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
