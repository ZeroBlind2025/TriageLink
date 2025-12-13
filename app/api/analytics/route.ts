import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = subDays(new Date(), days)

    const [
      postsOverTime,
      leadsOverTime,
      leadsByStatus,
      leadsByIcp,
      outreachStats,
      recentActivity,
    ] = await Promise.all([
      prisma.post.groupBy({
        by: ['scrapedAt'],
        where: {
          userId: session.user.id,
          scrapedAt: { gte: startDate },
        },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: true,
      }),
      prisma.post.groupBy({
        by: ['matchedIcpId'],
        where: {
          userId: session.user.id,
          matchedIcpId: { not: null },
        },
        _count: true,
      }),
      prisma.outreachSequence.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: true,
      }),
      prisma.activityLog.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: subDays(new Date(), 7) },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          lead: { select: { name: true, company: true } },
          post: { select: { authorName: true } },
        },
      }),
    ])

    const icpProfiles = await prisma.icpProfile.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
    })

    const icpMap = Object.fromEntries(icpProfiles.map((icp) => [icp.id, icp.name]))

    const dateRange: string[] = []
    for (let i = days; i >= 0; i--) {
      dateRange.push(format(subDays(new Date(), i), 'yyyy-MM-dd'))
    }

    const totalLeads = await prisma.lead.count({
      where: { userId: session.user.id },
    })

    const repliedLeads = await prisma.lead.count({
      where: { userId: session.user.id, status: 'replied' },
    })

    const convertedLeads = await prisma.lead.count({
      where: { userId: session.user.id, status: 'converted' },
    })

    const contactedLeads = await prisma.lead.count({
      where: {
        userId: session.user.id,
        status: { in: ['contacted', 'replied', 'converted'] },
      },
    })

    const replyRate = contactedLeads > 0 ? (repliedLeads / contactedLeads) * 100 : 0
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    const funnelData = [
      { stage: 'Posts Scraped', count: await prisma.post.count({ where: { userId: session.user.id } }) },
      { stage: 'Leads Created', count: totalLeads },
      { stage: 'Contacted', count: contactedLeads },
      { stage: 'Replied', count: repliedLeads },
      { stage: 'Converted', count: convertedLeads },
    ]

    return NextResponse.json({
      summary: {
        totalLeads,
        repliedLeads,
        convertedLeads,
        contactedLeads,
        replyRate: replyRate.toFixed(1),
        conversionRate: conversionRate.toFixed(1),
      },
      leadsByStatus: leadsByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      leadsByIcp: leadsByIcp.map((item) => ({
        icpId: item.matchedIcpId,
        icpName: icpMap[item.matchedIcpId || ''] || 'Unknown',
        count: item._count,
      })),
      outreachStats: outreachStats.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      funnelData,
      recentActivity,
      dateRange,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
