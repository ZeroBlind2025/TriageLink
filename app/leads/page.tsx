'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadDrawer } from '@/components/leads/lead-drawer'
import { LeadFilters } from '@/components/leads/lead-filters'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

interface FiltersState {
  status: string
  search: string
}

async function fetchLeads(page: number, filters: FiltersState) {
  const params = new URLSearchParams({
    page: page.toString(),
    ...(filters.status && { status: filters.status }),
    ...(filters.search && { search: filters.search }),
  })
  const response = await fetch(`/api/leads?${params}`)
  if (!response.ok) throw new Error('Failed to fetch leads')
  return response.json()
}

async function fetchLead(id: string) {
  const response = await fetch(`/api/leads/${id}`)
  if (!response.ok) throw new Error('Failed to fetch lead')
  return response.json()
}

async function fetchTemplates() {
  const response = await fetch('/api/templates')
  if (!response.ok) throw new Error('Failed to fetch templates')
  return response.json()
}

export default function LeadsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<FiltersState>({ status: '', search: '' })
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', page, filters],
    queryFn: () => fetchLeads(page, filters),
  })

  const { data: selectedLead, isLoading: leadLoading } = useQuery({
    queryKey: ['lead', selectedLeadId],
    queryFn: () => fetchLead(selectedLeadId!),
    enabled: !!selectedLeadId,
  })

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update lead')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', selectedLeadId] })
      toast({ title: 'Lead updated' })
    },
  })

  const startSequenceMutation = useMutation({
    mutationFn: async ({ leadId, templateIds }: { leadId: string; templateIds: string[] }) => {
      const response = await fetch(`/api/leads/${leadId}/start-sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateIds }),
      })
      if (!response.ok) throw new Error('Failed to start sequence')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', selectedLeadId] })
      toast({ title: 'Outreach sequence started' })
    },
  })

  return (
    <div>
      <PageHeader title="Leads" description="Manage your LinkedIn leads and outreach" />

      <LeadFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="mt-6">
          <Skeleton className="h-96" />
        </div>
      ) : leadsData?.leads?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No leads found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create leads from posts or via the N8N webhook
          </p>
        </div>
      ) : (
        <LeadsTable
          leads={leadsData?.leads || []}
          pagination={leadsData?.pagination}
          page={page}
          onPageChange={setPage}
          onSelectLead={setSelectedLeadId}
          onUpdateStatus={(id, status) => updateLeadMutation.mutate({ id, data: { status } })}
        />
      )}

      <LeadDrawer
        lead={selectedLead}
        isOpen={!!selectedLeadId}
        isLoading={leadLoading}
        onClose={() => setSelectedLeadId(null)}
        templates={templates || []}
        onUpdateLead={(data) => {
          if (selectedLeadId) {
            updateLeadMutation.mutate({ id: selectedLeadId, data })
          }
        }}
        onStartSequence={(templateIds) => {
          if (selectedLeadId) {
            startSequenceMutation.mutate({ leadId: selectedLeadId, templateIds })
          }
        }}
      />
    </div>
  )
}
