'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/leads/status-badge'
import { formatRelativeTime } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface Lead {
  id: string
  name: string | null
  company: string | null
  headline: string | null
  profileUrl: string
  avatarUrl: string | null
  status: string
  icpMatchScore: number
  lastContactedAt: string | null
  createdAt: string
  sourcePost?: { authorName: string | null } | null
}

interface LeadsTableProps {
  leads: Lead[]
  pagination?: {
    page: number
    totalPages: number
    total: number
  }
  page: number
  onPageChange: (page: number) => void
  onSelectLead: (id: string) => void
  onUpdateStatus: (id: string, status: string) => void
}

export function LeadsTable({
  leads,
  pagination,
  page,
  onPageChange,
  onSelectLead,
  onUpdateStatus,
}: LeadsTableProps) {
  return (
    <Card className="mt-6">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Lead</th>
                <th className="text-left p-4 font-medium">Company</th>
                <th className="text-left p-4 font-medium">Source</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Score</th>
                <th className="text-left p-4 font-medium">Last Contact</th>
                <th className="text-left p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const initials = (lead.name || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()

                return (
                  <tr
                    key={lead.id}
                    className="border-b hover:bg-muted/30 cursor-pointer"
                    onClick={() => onSelectLead(lead.id)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {lead.avatarUrl && <AvatarImage src={lead.avatarUrl} />}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lead.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-48">
                            {lead.headline}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{lead.company || '-'}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {lead.sourcePost?.authorName || 'Direct'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{lead.icpMatchScore}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {lead.lastContactedAt
                        ? formatRelativeTime(lead.lastContactedAt)
                        : '-'}
                    </td>
                    <td className="p-4">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
