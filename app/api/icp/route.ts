import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { icpProfileSchema } from '@/lib/validators'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const icpProfiles = await prisma.icpProfile.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    const profilesWithStats = await Promise.all(
      icpProfiles.map(async (profile) => {
        const leadsCount = await prisma.lead.count({
          where: {
            userId: session.user.id,
            sourcePost: { matchedIcpId: profile.id },
          },
        })
        return { ...profile, leadsCount }
      })
    )

    return NextResponse.json(profilesWithStats)
  } catch (error) {
    console.error('Error fetching ICP profiles:', error)
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
    const parsed = icpProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const icpProfile = await prisma.icpProfile.create({
      data: {
        userId: session.user.id,
        ...parsed.data,
      },
    })

    return NextResponse.json(icpProfile)
  } catch (error) {
    console.error('Error creating ICP profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
