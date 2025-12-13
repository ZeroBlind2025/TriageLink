import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const isReviewed = searchParams.get('isReviewed')
    const icpId = searchParams.get('icpId')
    const minScore = searchParams.get('minScore')

    const where = {
      userId: session.user.id,
      ...(isReviewed !== null && isReviewed !== '' && { isReviewed: isReviewed === 'true' }),
      ...(icpId && { matchedIcpId: icpId }),
      ...(minScore && { engagementScore: { gte: parseInt(minScore) } }),
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          matchedIcp: true,
        },
        orderBy: { scrapedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const posts = Array.isArray(body) ? body : [body]

    const createdPosts = await Promise.all(
      posts.map((post) =>
        prisma.post.upsert({
          where: {
            userId_linkedinPostId: {
              userId: session.user.id,
              linkedinPostId: post.linkedin_post_id || post.linkedinPostId,
            },
          },
          update: {
            likesCount: post.likes_count || post.likesCount || 0,
            commentsCount: post.comments_count || post.commentsCount || 0,
            engagementScore: post.engagement_score || post.engagementScore || 0,
          },
          create: {
            userId: session.user.id,
            linkedinPostId: post.linkedin_post_id || post.linkedinPostId,
            postUrl: post.post_url || post.postUrl,
            postContent: post.post_content || post.postContent,
            authorName: post.author_name || post.authorName,
            authorProfileUrl: post.author_profile_url || post.authorProfileUrl,
            authorHeadline: post.author_headline || post.authorHeadline,
            authorCompany: post.author_company || post.authorCompany,
            authorAvatarUrl: post.author_avatar_url || post.authorAvatarUrl,
            likesCount: post.likes_count || post.likesCount || 0,
            commentsCount: post.comments_count || post.commentsCount || 0,
            postedAt: post.posted_at || post.postedAt ? new Date(post.posted_at || post.postedAt) : null,
            matchedKeywords: post.matched_keywords || post.matchedKeywords || [],
            engagementScore: post.engagement_score || post.engagementScore || 0,
          },
        })
      )
    )

    return NextResponse.json({ posts: createdPosts })
  } catch (error) {
    console.error('Error creating posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
