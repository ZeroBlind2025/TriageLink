import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { startOfDay, endOfDay, subDays } from 'date-fns'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)

    const [
      newLeadsToday,
      pendingFollowups,
      totalLeads,
      repliedLeads,
      convertedLeads,
      contactedLeads,
      recentActivity,
      last7DaysLeads,
      last7DaysReplies,
    ] = await Promise.all([
      prisma.lead.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.outreachSequence.count({
        where: {
          userId: session.user.id,
          status: 'pending',
          scheduledFor: { lte: today },
        },
      }),
      prisma.lead.count({
        where: { userId: session.user.id },
      }),
      prisma.lead.count({
        where: { userId: session.user.id, status: 'replied' },
      }),
      prisma.lead.count({
        where: { userId: session.user.id, status: 'converted' },
      }),
      prisma.lead.count({
        where: {
          userId: session.user.id,
          firstContactedAt: { not: null },
        },
      }),
      prisma.activityLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          lead: { select: { name: true, company: true } },
          post: { select: { authorName: true } },
        },
      }),
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const date = subDays(today, 6 - i)
          return prisma.lead.count({
            where: {
              userId: session.user.id,
              createdAt: {
                gte: startOfDay(date),
                lte: endOfDay(date),
              },
            },
          })
        })
      ),
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const date = subDays(today, 6 - i)
          return prisma.lead.count({
            where: {
              userId: session.user.id,
              repliedAt: {
                gte: startOfDay(date),
                lte: endOfDay(date),
              },
            },
          })
        })
      ),
    ])

    const replyRate = contactedLeads > 0 ? (repliedLeads / contactedLeads) * 100 : 0
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    const chartData = Array.from({ length: 7 }, (_, i) => ({
      date: subDays(today, 6 - i).toISOString().split('T')[0],
      leads: last7DaysLeads[i],
      replies: last7DaysReplies[i],
    }))

    return NextResponse.json({
      stats: {
        newLeadsToday,
        pendingFollowups,
        replyRate: replyRate.toFixed(1),
        conversionRate: conversionRate.toFixed(1),
        totalLeads,
        repliedLeads,
      },
      recentActivity,
      chartData,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
