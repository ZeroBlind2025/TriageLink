import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

export const icpProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  jobTitles: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  companySizes: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  excludeKeywords: z.array(z.string()).default([]),
  minEngagementScore: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const messageTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  templateType: z.enum(['connection_request', 'follow_up', 'inmail']).default('connection_request'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  stepNumber: z.number().int().min(1).default(1),
  delayDays: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const leadUpdateSchema = z.object({
  status: z.enum(['new', 'qualified', 'contacted', 'replied', 'converted', 'opted_out', 'disqualified']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const postUpdateSchema = z.object({
  isReviewed: z.boolean().optional(),
  isRelevant: z.boolean().optional(),
  notes: z.string().optional(),
})

export const userSettingsSchema = z.object({
  phantombusterApiKey: z.string().optional(),
  phantombusterAgentId: z.string().optional(),
  n8nWebhookUrl: z.string().url().optional().or(z.literal('')),
})

export const webhookPayloadSchema = z.object({
  lead_id: z.string().uuid().optional(),
  profile_url: z.string().optional(),
})

export const startSequenceSchema = z.object({
  templateIds: z.array(z.string().uuid()),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type IcpProfileInput = z.infer<typeof icpProfileSchema>
export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>
export type PostUpdateInput = z.infer<typeof postUpdateSchema>
export type UserSettingsInput = z.infer<typeof userSettingsSchema>
