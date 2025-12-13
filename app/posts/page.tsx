'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { PostCard } from '@/components/posts/post-card'
import { PostFilters } from '@/components/posts/post-filters'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface FiltersState {
  isReviewed: string
  icpId: string
  minScore: string
}

async function fetchPosts(page: number, filters: FiltersState) {
  const params = new URLSearchParams({
    page: page.toString(),
    ...(filters.isReviewed && { isReviewed: filters.isReviewed }),
    ...(filters.icpId && { icpId: filters.icpId }),
    ...(filters.minScore && { minScore: filters.minScore }),
  })
  const response = await fetch(`/api/posts?${params}`)
  if (!response.ok) throw new Error('Failed to fetch posts')
  return response.json()
}

async function fetchIcpProfiles() {
  const response = await fetch('/api/icp')
  if (!response.ok) throw new Error('Failed to fetch ICP profiles')
  return response.json()
}

export default function PostsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<FiltersState>({
    isReviewed: '',
    icpId: '',
    minScore: '',
  })
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', page, filters],
    queryFn: () => fetchPosts(page, filters),
  })

  const { data: icpProfiles } = useQuery({
    queryKey: ['icp-profiles'],
    queryFn: fetchIcpProfiles,
  })

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update post')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast({ title: 'Post updated' })
    },
  })

  const createLeadMutation = useMutation({
    mutationFn: async (post: Record<string, unknown>) => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: post.authorName,
          profileUrl: post.authorProfileUrl,
          headline: post.authorHeadline,
          company: post.authorCompany,
          avatarUrl: post.authorAvatarUrl,
          sourcePostId: post.id,
        }),
      })
      if (!response.ok) throw new Error('Failed to create lead')
      return response.json()
    },
    onSuccess: () => {
      toast({ title: 'Lead created successfully' })
    },
  })

  return (
    <div>
      <PageHeader title="Posts" description="Review scraped LinkedIn posts from your ICPs" />

      <PostFilters
        filters={filters}
        onFiltersChange={setFilters}
        icpProfiles={icpProfiles || []}
      />

      {postsLoading ? (
        <div className="grid gap-4 mt-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : postsData?.posts?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Posts will appear here once scraped via N8N workflow
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 mt-6">
            {postsData?.posts?.map((post: Record<string, unknown>) => (
              <PostCard
                key={post.id as string}
                post={post}
                onMarkRelevant={(isRelevant) =>
                  updatePostMutation.mutate({
                    id: post.id as string,
                    data: { isRelevant, isReviewed: true },
                  })
                }
                onCreateLead={() => createLeadMutation.mutate(post)}
              />
            ))}
          </div>

          {postsData?.pagination && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {postsData.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= postsData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
