import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { encrypt, decrypt, isEncrypted } from '@/lib/encryption'
import { userSettingsSchema } from '@/lib/validators'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })

    if (!settings) {
      return NextResponse.json({
        phantombusterApiKey: '',
        phantombusterAgentId: '',
        n8nWebhookUrl: '',
      })
    }

    return NextResponse.json({
      phantombusterApiKey: settings.phantombusterApiKeyEncrypted ? '********' : '',
      phantombusterAgentId: settings.phantombusterAgentId || '',
      n8nWebhookUrl: settings.n8nWebhookUrl || '',
      hasPhantombusterKey: !!settings.phantombusterApiKeyEncrypted,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = userSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const updateData: Record<string, string | null> = {}

    if (parsed.data.phantombusterApiKey !== undefined) {
      if (parsed.data.phantombusterApiKey === '') {
        updateData.phantombusterApiKeyEncrypted = null
      } else if (parsed.data.phantombusterApiKey !== '********') {
        updateData.phantombusterApiKeyEncrypted = encrypt(parsed.data.phantombusterApiKey)
      }
    }

    if (parsed.data.phantombusterAgentId !== undefined) {
      updateData.phantombusterAgentId = parsed.data.phantombusterAgentId || null
    }

    if (parsed.data.n8nWebhookUrl !== undefined) {
      updateData.n8nWebhookUrl = parsed.data.n8nWebhookUrl || null
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    })

    return NextResponse.json({
      phantombusterApiKey: settings.phantombusterApiKeyEncrypted ? '********' : '',
      phantombusterAgentId: settings.phantombusterAgentId || '',
      n8nWebhookUrl: settings.n8nWebhookUrl || '',
      hasPhantombusterKey: !!settings.phantombusterApiKeyEncrypted,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
