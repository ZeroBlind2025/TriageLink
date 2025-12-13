import { User, Post, Lead, IcpProfile, MessageTemplate, OutreachSequence, ActivityLog } from '@prisma/client'

export type { User, Post, Lead, IcpProfile, MessageTemplate, OutreachSequence, ActivityLog }

export interface PostWithIcp extends Post {
  matchedIcp?: IcpProfile | null
}

export interface LeadWithPost extends Lead {
  sourcePost?: Post | null
  outreachSequences?: OutreachSequence[]
}

export interface OutreachSequenceWithDetails extends OutreachSequence {
  lead?: Lead
  template?: MessageTemplate | null
}

export interface DashboardStats {
  newLeadsToday: number
  pendingFollowups: number
  replyRate: number
  conversionRate: number
  totalLeads: number
  totalReplies: number
}

export interface ActivityLogWithDetails extends ActivityLog {
  lead?: Lead | null
  post?: Post | null
}

export interface AnalyticsData {
  postsScraped: number[]
  leadsCreated: number[]
  repliesReceived: number[]
  dates: string[]
  leadsByIcp: { name: string; count: number }[]
  funnelData: { stage: string; count: number }[]
}

export interface ChartDataPoint {
  date: string
  value: number
  [key: string]: string | number
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
