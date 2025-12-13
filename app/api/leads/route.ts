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
    const search = searchParams.get('search')

    const where = {
      userId: session.user.id,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { company: { contains: search, mode: 'insensitive' as const } },
          { headline: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          sourcePost: true,
          outreachSequences: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ])

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const lead = await prisma.lead.upsert({
      where: {
        userId_profileUrl: {
          userId: session.user.id,
          profileUrl: body.profileUrl || body.profile_url,
        },
      },
      update: {
        name: body.name,
        firstName: body.firstName || body.first_name,
        lastName: body.lastName || body.last_name,
        headline: body.headline,
        company: body.company,
        avatarUrl: body.avatarUrl || body.avatar_url,
      },
      create: {
        userId: session.user.id,
        name: body.name,
        firstName: body.firstName || body.first_name,
        lastName: body.lastName || body.last_name,
        profileUrl: body.profileUrl || body.profile_url,
        headline: body.headline,
        company: body.company,
        location: body.location,
        avatarUrl: body.avatarUrl || body.avatar_url,
        sourcePostId: body.sourcePostId || body.source_post_id,
        sourceType: body.sourceType || body.source_type || 'post_author',
        icpMatchScore: body.icpMatchScore || body.icp_match_score || 0,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        leadId: lead.id,
        activityType: 'lead_created',
        description: `Created lead: ${lead.name}`,
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
