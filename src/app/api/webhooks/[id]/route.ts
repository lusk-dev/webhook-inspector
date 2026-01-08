import { getDb } from '@/lib/db'
import { webhooks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

type Env = {
  DB: D1Database
}

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = paramsSchema.parse(await params)

    // Get Cloudflare env from request context
    const env = process.env as unknown as Env
    const db = getDb(env)

    const result = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, id))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { message: 'Webhook not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error getting webhook:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook ID', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to get webhook' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = paramsSchema.parse(await params)

    // Get Cloudflare env from request context
    const env = process.env as unknown as Env
    const db = getDb(env)

    const result = await db
      .delete(webhooks)
      .where(eq(webhooks.id, id))
      .returning()

    if (result.length === 0) {
      return NextResponse.json(
        { message: 'Webhook not found.' },
        { status: 404 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting webhook:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook ID', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}
