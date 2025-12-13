import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.outreachSequence.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (body.status) {
      updateData.status = body.status
      if (body.status === 'cancelled') {
        updateData.cancelledReason = body.cancelledReason || 'manual'
      }
      if (body.status === 'sent') {
        updateData.sentAt = new Date()
      }
    }

    const updated = await prisma.outreachSequence.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating sequence:', error)
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
    const existing = await prisma.outreachSequence.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    await prisma.outreachSequence.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sequence:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
