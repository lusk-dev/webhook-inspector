import { getDb } from '@/lib/db'
import { webhooks } from '@/lib/db/schema'
import { desc, lt } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

type Env = {
  DB: D1Database
}

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const params = querySchema.parse({
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
    })

    // Get Cloudflare env from request context
    const env = process.env as unknown as Env
    const db = getDb(env)

    // Query webhooks with pagination
    const result = await db
      .select({
        id: webhooks.id,
        method: webhooks.method,
        pathname: webhooks.pathname,
        createdAt: webhooks.createdAt,
      })
      .from(webhooks)
      .where(params.cursor ? lt(webhooks.id, params.cursor) : undefined)
      .orderBy(desc(webhooks.id))
      .limit(params.limit + 1)

    const hasMore = result.length > params.limit
    const items = hasMore ? result.slice(0, params.limit) : result
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({
      webhooks: items,
      nextCursor,
    })
  } catch (error) {
    console.error('Error listing webhooks:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to list webhooks' },
      { status: 500 }
    )
  }
}
