import { getDb } from '@/lib/db'
import { webhooks } from '@/lib/db/schema'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

type Env = {
  DB: D1Database
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleWebhook(request, 'GET', params)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleWebhook(request, 'POST', params)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleWebhook(request, 'PUT', params)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleWebhook(request, 'PATCH', params)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleWebhook(request, 'DELETE', params)
}

async function handleWebhook(
  request: NextRequest,
  method: string,
  params: Promise<{ path: string[] }>
) {
  try {
    const { path } = await params
    const pathname = `/${path.join('/')}`

    // Get Cloudflare env from request context
    const env = process.env as unknown as Env
    const db = getDb(env)

    // Extract request details
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
    const contentType = request.headers.get('content-type')
    const contentLength = request.headers.get('content-length')
      ? Number(request.headers.get('content-length'))
      : null

    // Get request body
    let body: string | null = null
    try {
      const contentTypeHeader = request.headers.get('content-type') || ''
      if (contentTypeHeader.includes('application/json')) {
        const jsonBody = await request.json()
        body = JSON.stringify(jsonBody, null, 2)
      } else {
        body = await request.text()
      }
    } catch {
      // Body might be empty or invalid
      body = null
    }

    // Convert headers to object
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    // Insert webhook into database
    const result = await db
      .insert(webhooks)
      .values({
        method,
        ip,
        contentType,
        contentLength,
        body,
        headers,
        pathname,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      })
      .returning()

    return NextResponse.json({ id: result[0].id }, { status: 201 })
  } catch (error) {
    console.error('Error capturing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to capture webhook' },
      { status: 500 }
    )
  }
}
