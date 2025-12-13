'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusBadge } from '@/components/leads/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/utils'
import { ExternalLink, Send, CheckCircle } from 'lucide-react'

interface LeadDrawerProps {
  lead: Record<string, unknown> | null
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  templates: Array<{ id: string; name: string; templateType: string; stepNumber: number }>
  onUpdateLead: (data: Record<string, unknown>) => void
  onStartSequence: (templateIds: string[]) => void
}

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'converted', label: 'Converted' },
  { value: 'opted_out', label: 'Opted Out' },
  { value: 'disqualified', label: 'Disqualified' },
]

export function LeadDrawer({
  lead,
  isOpen,
  isLoading,
  onClose,
  templates,
  onUpdateLead,
  onStartSequence,
}: LeadDrawerProps) {
  const [notes, setNotes] = useState('')
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])

  const initials = lead
    ? ((lead.name as string) || 'U')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U'

  const handleStartSequence = () => {
    if (selectedTemplates.length > 0) {
      onStartSequence(selectedTemplates)
      setSelectedTemplates([])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : lead ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  {lead.avatarUrl && <AvatarImage src={lead.avatarUrl as string} />}
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <DialogTitle className="text-xl">{lead.name as string}</DialogTitle>
                  <p className="text-muted-foreground">{lead.headline as string}</p>
                  {lead.company && (
                    <p className="text-sm text-muted-foreground">{lead.company as string}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={lead.status as string} />
                    {lead.profileUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={lead.profileUrl as string}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="outreach">Outreach</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={lead.status as string}
                      onValueChange={(value) => onUpdateLead({ status: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ICP Match Score</label>
                    <p className="mt-1 text-2xl font-bold">
                      {lead.icpMatchScore as number}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    className="mt-1"
                    placeholder="Add notes about this lead..."
                    value={notes || (lead.notes as string) || ''}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={() => {
                      if (notes !== (lead.notes as string)) {
                        onUpdateLead({ notes })
                      }
                    }}
                  />
                </div>

                {lead.sourcePost && (
                  <div>
                    <label className="text-sm font-medium">Source Post</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      From post by {(lead.sourcePost as { authorName: string }).authorName}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">First Contacted:</span>
                    <p>
                      {lead.firstContactedAt
                        ? formatDateTime(lead.firstContactedAt as string)
                        : 'Not yet'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Replied At:</span>
                    <p>
                      {lead.repliedAt
                        ? formatDateTime(lead.repliedAt as string)
                        : 'Not yet'}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="outreach" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Start New Sequence</label>
                  <div className="mt-2 space-y-2">
                    {templates.map((template) => (
                      <label
                        key={template.id}
                        className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTemplates.includes(template.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTemplates([...selectedTemplates, template.id])
                            } else {
                              setSelectedTemplates(
                                selectedTemplates.filter((id) => id !== template.id)
                              )
                            }
                          }}
                        />
                        <span className="flex-1">{template.name}</span>
                        <Badge variant="outline">{template.templateType}</Badge>
                      </label>
                    ))}
                  </div>
                  <Button
                    className="mt-4"
                    disabled={selectedTemplates.length === 0}
                    onClick={handleStartSequence}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Start Sequence ({selectedTemplates.length} steps)
                  </Button>
                </div>

                {(lead.outreachSequences as unknown[])?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Outreach History</label>
                    <ScrollArea className="h-48 mt-2">
                      <div className="space-y-2">
                        {(lead.outreachSequences as Array<Record<string, unknown>>).map(
                          (seq) => (
                            <div
                              key={seq.id as string}
                              className="flex items-center gap-2 p-2 border rounded text-sm"
                            >
                              <CheckCircle
                                className={`h-4 w-4 ${
                                  seq.status === 'sent'
                                    ? 'text-green-500'
                                    : seq.status === 'cancelled'
                                    ? 'text-red-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                              <span className="flex-1">
                                Step {seq.stepNumber as number} -{' '}
                                {(seq.template as { name: string })?.name || 'Message'}
                              </span>
                              <Badge variant="outline">{seq.status as string}</Badge>
                            </div>
                          )
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity">
                <ScrollArea className="h-64">
                  {(lead.activityLogs as unknown[])?.length > 0 ? (
                    <div className="space-y-3">
                      {(lead.activityLogs as Array<Record<string, unknown>>).map((log) => (
                        <div
                          key={log.id as string}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                          <div className="flex-1">
                            <p>{log.description as string}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(log.createdAt as string)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No activity yet
                    </p>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
