import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const status = searchParams.get('status')

    const where = {
      userId: session.user.id,
      ...(status && { status }),
    }

    const [sequences, total] = await Promise.all([
      prisma.outreachSequence.findMany({
        where,
        include: {
          lead: true,
          template: true,
        },
        orderBy: { scheduledFor: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.outreachSequence.count({ where }),
    ])

    return NextResponse.json({
      sequences,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching outreach sequences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
