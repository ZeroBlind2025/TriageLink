import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelativeTime } from '@/lib/utils'
import {
  UserPlus,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react'

interface ActivityItem {
  id: string
  activityType: string
  description: string | null
  createdAt: string
  lead?: { name: string | null; company: string | null } | null
  post?: { authorName: string | null } | null
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

const activityIcons: Record<string, typeof Activity> = {
  lead_created: UserPlus,
  message_sent: Send,
  reply_received: MessageSquare,
  status_changed: CheckCircle,
  sequence_started: Send,
  webhook_new_leads: Activity,
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              activities.map((activity) => {
                const Icon = activityIcons[activity.activityType] || Activity
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {activity.description || activity.activityType.replace(/_/g, ' ')}
                      </p>
                      {activity.lead && (
                        <p className="text-xs text-muted-foreground">
                          {activity.lead.name}
                          {activity.lead.company && ` at ${activity.lead.company}`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
