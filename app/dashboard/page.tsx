'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { MiniChart } from '@/components/dashboard/mini-chart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Clock, TrendingUp, Target, FileText, Send } from 'lucide-react'
import Link from 'next/link'

async function fetchDashboardData() {
  const response = await fetch('/api/dashboard')
  if (!response.ok) throw new Error('Failed to fetch dashboard data')
  return response.json()
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your lead triage activity" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  const { stats, recentActivity, chartData } = data

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your lead triage activity">
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/posts">
              <FileText className="h-4 w-4 mr-2" />
              Review Posts
            </Link>
          </Button>
          <Button asChild>
            <Link href="/outreach">
              <Send className="h-4 w-4 mr-2" />
              Pending Outreach
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="New Leads Today"
          value={stats.newLeadsToday}
          icon={Users}
          description={`${stats.totalLeads} total leads`}
        />
        <StatsCard
          title="Pending Follow-ups"
          value={stats.pendingFollowups}
          icon={Clock}
          description="Scheduled for today"
        />
        <StatsCard
          title="Reply Rate"
          value={`${stats.replyRate}%`}
          icon={TrendingUp}
          description={`${stats.repliedLeads} total replies`}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={Target}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MiniChart data={chartData} />
        <ActivityFeed activities={recentActivity} />
      </div>
    </div>
  )
}
