'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime, truncate } from '@/lib/utils'
import { ThumbsUp, MessageCircle, Share2, Check, X, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'

interface PostCardProps {
  post: Record<string, unknown>
  onMarkRelevant: (isRelevant: boolean) => void
  onCreateLead: () => void
}

export function PostCard({ post, onMarkRelevant, onCreateLead }: PostCardProps) {
  const [expanded, setExpanded] = useState(false)

  const content = (post.postContent as string) || ''
  const shouldTruncate = content.length > 300

  const initials = ((post.authorName as string) || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <Card className={post.isReviewed ? 'opacity-75' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              {post.authorAvatarUrl ? (
                <AvatarImage src={post.authorAvatarUrl as string} alt={post.authorName as string} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.authorName as string}</p>
              <p className="text-sm text-muted-foreground">{post.authorHeadline as string}</p>
              {post.authorCompany ? (
                <p className="text-xs text-muted-foreground">{post.authorCompany as string}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Score: {post.engagementScore as number}</Badge>
            {post.isReviewed ? (
              <Badge variant={post.isRelevant ? 'default' : 'outline'}>
                {post.isRelevant ? 'Relevant' : 'Not Relevant'}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap mb-4">
          {expanded ? content : truncate(content, 300)}
          {shouldTruncate ? (
            <Button
              variant="link"
              className="px-1 h-auto"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  Show more <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          ) : null}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            {post.likesCount as number}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {post.commentsCount as number}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            {post.repostsCount as number || 0}
          </span>
          <span className="ml-auto">{formatRelativeTime(post.postedAt as string)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkRelevant(true)}
            disabled={post.isRelevant === true}
          >
            <Check className="h-4 w-4 mr-1" />
            Relevant
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkRelevant(false)}
            disabled={post.isRelevant === false}
          >
            <X className="h-4 w-4 mr-1" />
            Not Relevant
          </Button>
          <Button size="sm" onClick={onCreateLead}>
            <UserPlus className="h-4 w-4 mr-1" />
            Create Lead
          </Button>
          {post.postUrl ? (
            <Button size="sm" variant="ghost" asChild className="ml-auto">
              <a href={post.postUrl as string} target="_blank" rel="noopener noreferrer">
                View on LinkedIn
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
