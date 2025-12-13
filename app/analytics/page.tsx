'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/dashboard/stats-card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts'
import { Users, MessageSquare, TrendingUp, Target } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

async function fetchAnalytics(days: number) {
  const response = await fetch(`/api/analytics?days=${days}`)
  if (!response.ok) throw new Error('Failed to fetch analytics')
  return response.json()
}

export default function AnalyticsPage() {
  const [days, setDays] = useState('30')

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => fetchAnalytics(parseInt(days)),
  })

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

  const { summary, leadsByStatus, leadsByIcp, funnelData } = data || {}

  return (
    <div>
      <PageHeader title="Analytics" description="Track your lead generation performance">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Leads"
          value={summary?.totalLeads || 0}
          icon={Users}
        />
        <StatsCard
          title="Contacted"
          value={summary?.contactedLeads || 0}
          icon={MessageSquare}
        />
        <StatsCard
          title="Reply Rate"
          value={`${summary?.replyRate || 0}%`}
          icon={TrendingUp}
          description={`${summary?.repliedLeads || 0} replies`}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${summary?.conversionRate || 0}%`}
          icon={Target}
          description={`${summary?.convertedLeads || 0} conversions`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsByStatus}>
                  <XAxis
                    dataKey="status"
                    tickFormatter={(value) => value.replace(/_/g, ' ')}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads by ICP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {leadsByIcp?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsByIcp}
                      dataKey="count"
                      nameKey="icpName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => entry.icpName}
                    >
                      {leadsByIcp.map((_: unknown, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No ICP data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="count" data={funnelData} isAnimationActive>
                  <LabelList
                    position="right"
                    fill="#000"
                    stroke="none"
                    dataKey="stage"
                  />
                  {funnelData?.map((_: unknown, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
