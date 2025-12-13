'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, MessageSquare } from 'lucide-react'

interface MessageTemplate {
  id: string
  name: string
  templateType: string
  subject: string | null
  body: string
  stepNumber: number
  delayDays: number
  isActive: boolean
  usageCount: number
  replyRate: number
}

const emptyTemplate = {
  name: '',
  templateType: 'connection_request',
  subject: '',
  body: '',
  stepNumber: 1,
  delayDays: 0,
  isActive: true,
}

async function fetchTemplates() {
  const response = await fetch('/api/templates')
  if (!response.ok) throw new Error('Failed to fetch templates')
  return response.json()
}

export default function TemplatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [formData, setFormData] = useState(emptyTemplate)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyTemplate) => {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setIsDialogOpen(false)
      toast({ title: 'Template created' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyTemplate }) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setIsDialogOpen(false)
      setEditingTemplate(null)
      toast({ title: 'Template updated' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast({ title: 'Template deleted' })
    },
  })

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setFormData(emptyTemplate)
    setIsDialogOpen(true)
  }

  const openEditDialog = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      templateType: template.templateType,
      subject: template.subject || '',
      body: template.body,
      stepNumber: template.stepNumber,
      delayDays: template.delayDays,
      isActive: template.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      connection_request: 'Connection Request',
      follow_up: 'Follow-up',
      inmail: 'InMail',
    }
    return labels[type] || type
  }

  return (
    <div>
      <PageHeader title="Message Templates" description="Create reusable outreach templates">
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : templates?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No templates yet</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates?.map((template: MessageTemplate) => (
            <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {!template.isActive && <Badge variant="outline">Inactive</Badge>}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{getTypeLabel(template.templateType)}</Badge>
                      <Badge variant="outline">Step {template.stepNumber}</Badge>
                      {template.delayDays > 0 && (
                        <Badge variant="outline">+{template.delayDays} days</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this template?')) {
                          deleteMutation.mutate(template.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{template.body}</p>
                <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                  <span>Used {template.usageCount} times</span>
                  <span>{template.replyRate}% reply rate</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Initial Connection Request"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.templateType}
                onValueChange={(value) => setFormData({ ...formData, templateType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connection_request">Connection Request</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="inmail">InMail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.templateType === 'inmail' && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Quick question about {{company}}"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Message Body *</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Use {{name}}, {{first_name}}, {{company}}, {{headline}} for personalization"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {'{{name}}'}, {'{{first_name}}'}, {'{{company}}'}, {'{{headline}}'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Step Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.stepNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, stepNumber: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Delay (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.delayDays}
                  onChange={(e) =>
                    setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.body}>
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
