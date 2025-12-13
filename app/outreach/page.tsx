'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/leads/status-badge'
import { X, Send } from 'lucide-react'

async function fetchOutreach(page: number, status: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    ...(status && { status }),
  })
  const response = await fetch(`/api/outreach?${params}`)
  if (!response.ok) throw new Error('Failed to fetch outreach')
  return response.json()
}

export default function OutreachPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['outreach', page, status],
    queryFn: () => fetchOutreach(page, status),
    refetchInterval: 30000,
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/outreach/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancelledReason: 'manual' }),
      })
      if (!response.ok) throw new Error('Failed to cancel')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach'] })
      toast({ title: 'Outreach cancelled' })
    },
  })

  return (
    <div>
      <PageHeader title="Outreach" description="Manage your scheduled outreach sequences" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            {status && (
              <Button variant="ghost" size="sm" onClick={() => setStatus('')}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : data?.sequences?.length === 0 ? (
        <div className="text-center py-12">
          <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No outreach sequences</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start a sequence from a lead&apos;s profile
          </p>
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Lead</th>
                    <th className="text-left p-4 font-medium">Template</th>
                    <th className="text-left p-4 font-medium">Step</th>
                    <th className="text-left p-4 font-medium">Scheduled For</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.sequences?.map((seq: Record<string, unknown>) => (
                    <tr key={seq.id as string} className="border-b">
                      <td className="p-4">
                        <p className="font-medium">
                          {(seq.lead as { name: string })?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(seq.lead as { company: string })?.company}
                        </p>
                      </td>
                      <td className="p-4 text-sm">
                        {(seq.template as { name: string })?.name || 'Custom'}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">Step {seq.stepNumber as number}</Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDateTime(seq.scheduledFor as string)}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={seq.status as string} />
                      </td>
                      <td className="p-4">
                        {seq.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelMutation.mutate(seq.id as string)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
