'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface FiltersState {
  isReviewed: string
  icpId: string
  minScore: string
}

interface PostFiltersProps {
  filters: FiltersState
  onFiltersChange: (filters: FiltersState) => void
  icpProfiles: Array<{ id: string; name: string }>
}

export function PostFilters({ filters, onFiltersChange, icpProfiles }: PostFiltersProps) {
  const hasFilters = filters.isReviewed || filters.icpId || filters.minScore

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>Review Status</Label>
            <Select
              value={filters.isReviewed}
              onValueChange={(value) => onFiltersChange({ ...filters, isReviewed: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All posts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All posts</SelectItem>
                <SelectItem value="false">Unreviewed</SelectItem>
                <SelectItem value="true">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ICP Profile</Label>
            <Select
              value={filters.icpId}
              onValueChange={(value) => onFiltersChange({ ...filters, icpId: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All ICPs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All ICPs</SelectItem>
                {icpProfiles.map((icp) => (
                  <SelectItem key={icp.id} value={icp.id}>
                    {icp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Min Engagement Score</Label>
            <Input
              type="number"
              className="w-32"
              placeholder="0"
              value={filters.minScore}
              onChange={(e) => onFiltersChange({ ...filters, minScore: e.target.value })}
            />
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({ isReviewed: '', icpId: '', minScore: '' })}
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
