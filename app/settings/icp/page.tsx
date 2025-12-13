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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Target } from 'lucide-react'

interface IcpProfile {
  id: string
  name: string
  description: string | null
  keywords: string[]
  jobTitles: string[]
  industries: string[]
  companySizes: string[]
  locations: string[]
  excludeKeywords: string[]
  minEngagementScore: number
  isActive: boolean
  leadsCount?: number
}

const emptyProfile: Omit<IcpProfile, 'id' | 'leadsCount'> = {
  name: '',
  description: '',
  keywords: [],
  jobTitles: [],
  industries: [],
  companySizes: [],
  locations: [],
  excludeKeywords: [],
  minEngagementScore: 0,
  isActive: true,
}

async function fetchIcpProfiles() {
  const response = await fetch('/api/icp')
  if (!response.ok) throw new Error('Failed to fetch ICP profiles')
  return response.json()
}

export default function IcpProfilesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<IcpProfile | null>(null)
  const [formData, setFormData] = useState(emptyProfile)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['icp-profiles'],
    queryFn: fetchIcpProfiles,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyProfile) => {
      const response = await fetch('/api/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-profiles'] })
      setIsDialogOpen(false)
      toast({ title: 'ICP profile created' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyProfile }) => {
      const response = await fetch(`/api/icp/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-profiles'] })
      setIsDialogOpen(false)
      setEditingProfile(null)
      toast({ title: 'ICP profile updated' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/icp/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-profiles'] })
      toast({ title: 'ICP profile deleted' })
    },
  })

  const openCreateDialog = () => {
    setEditingProfile(null)
    setFormData(emptyProfile)
    setIsDialogOpen(true)
  }

  const openEditDialog = (profile: IcpProfile) => {
    setEditingProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || '',
      keywords: profile.keywords,
      jobTitles: profile.jobTitles,
      industries: profile.industries,
      companySizes: profile.companySizes,
      locations: profile.locations,
      excludeKeywords: profile.excludeKeywords,
      minEngagementScore: profile.minEngagementScore,
      isActive: profile.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingProfile) {
      updateMutation.mutate({ id: editingProfile.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const parseArrayInput = (value: string) => {
    return value.split(',').map((s) => s.trim()).filter(Boolean)
  }

  return (
    <div>
      <PageHeader title="ICP Profiles" description="Define your Ideal Customer Profiles">
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Profile
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : profiles?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No ICP profiles yet</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles?.map((profile: IcpProfile) => (
            <Card key={profile.id} className={!profile.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {profile.name}
                      {!profile.isActive && <Badge variant="outline">Inactive</Badge>}
                    </CardTitle>
                    {profile.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {profile.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(profile)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this ICP profile?')) {
                          deleteMutation.mutate(profile.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {profile.keywords.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Keywords:</span>{' '}
                      {profile.keywords.slice(0, 3).join(', ')}
                      {profile.keywords.length > 3 && ` +${profile.keywords.length - 3} more`}
                    </div>
                  )}
                  {profile.jobTitles.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Titles:</span>{' '}
                      {profile.jobTitles.slice(0, 3).join(', ')}
                      {profile.jobTitles.length > 3 && ` +${profile.jobTitles.length - 3} more`}
                    </div>
                  )}
                  <div className="pt-2">
                    <Badge variant="secondary">{profile.leadsCount || 0} leads</Badge>
                    <Badge variant="outline" className="ml-2">
                      Min score: {profile.minEngagementScore}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit' : 'Create'} ICP Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., SaaS Founders"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this ICP..."
              />
            </div>
            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Input
                value={formData.keywords.join(', ')}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: parseArrayInput(e.target.value) })
                }
                placeholder="e.g., startup, funding, scaling"
              />
            </div>
            <div className="space-y-2">
              <Label>Job Titles (comma-separated)</Label>
              <Input
                value={formData.jobTitles.join(', ')}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitles: parseArrayInput(e.target.value) })
                }
                placeholder="e.g., CEO, Founder, CTO"
              />
            </div>
            <div className="space-y-2">
              <Label>Industries (comma-separated)</Label>
              <Input
                value={formData.industries.join(', ')}
                onChange={(e) =>
                  setFormData({ ...formData, industries: parseArrayInput(e.target.value) })
                }
                placeholder="e.g., SaaS, FinTech"
              />
            </div>
            <div className="space-y-2">
              <Label>Min Engagement Score</Label>
              <Input
                type="number"
                value={formData.minEngagementScore}
                onChange={(e) =>
                  setFormData({ ...formData, minEngagementScore: parseInt(e.target.value) || 0 })
                }
              />
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
            <Button onClick={handleSave} disabled={!formData.name}>
              {editingProfile ? 'Save Changes' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
