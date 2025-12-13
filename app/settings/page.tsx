'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Key, Webhook } from 'lucide-react'

async function fetchSettings() {
  const response = await fetch('/api/settings')
  if (!response.ok) throw new Error('Failed to fetch settings')
  return response.json()
}

export default function SettingsPage() {
  const [phantombusterApiKey, setPhantombusterApiKey] = useState('')
  const [phantombusterAgentId, setPhantombusterAgentId] = useState('')
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  useEffect(() => {
    if (settings) {
      setPhantombusterApiKey(settings.phantombusterApiKey || '')
      setPhantombusterAgentId(settings.phantombusterAgentId || '')
      setN8nWebhookUrl(settings.n8nWebhookUrl || '')
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update settings')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast({ title: 'Settings saved successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to save settings', variant: 'destructive' })
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      phantombusterApiKey,
      phantombusterAgentId,
      n8nWebhookUrl,
    })
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Settings" description="Configure your integrations and preferences" />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle className="text-lg">PhantomBuster Integration</CardTitle>
            </div>
            <CardDescription>
              Connect to PhantomBuster for LinkedIn scraping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pb-api-key">API Key</Label>
              <Input
                id="pb-api-key"
                type="password"
                placeholder="Enter your PhantomBuster API key"
                value={phantombusterApiKey}
                onChange={(e) => setPhantombusterApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Find this in PhantomBuster Settings &gt; API Keys
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pb-agent-id">Agent ID</Label>
              <Input
                id="pb-agent-id"
                placeholder="e.g., 123456789"
                value={phantombusterAgentId}
                onChange={(e) => setPhantombusterAgentId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The ID of the Phantom you want to trigger
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              <CardTitle className="text-lg">N8N Integration</CardTitle>
            </div>
            <CardDescription>
              Configure webhook URL for N8N automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="n8n-webhook">Webhook URL</Label>
              <Input
                id="n8n-webhook"
                type="url"
                placeholder="https://your-n8n-instance.com/webhook/..."
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The base URL of your N8N webhook endpoint
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
