import { getDb } from '@/lib/db'
import { webhooks } from '@/lib/db/schema'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

type Env = {
  DB: D1Database
}

const bodySchema = z.object({
  webhookIds: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookIds } = bodySchema.parse(body)

    // Get Cloudflare env from request context
    const env = process.env as unknown as Env
    const db = getDb(env)

    const result = await db
      .select({ body: webhooks.body })
      .from(webhooks)
      .where(inArray(webhooks.id, webhookIds))

    const webhooksBodies = result
      .map((webhook) => webhook.body)
      .join('\n\n')

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `
        Generate a TypeScript function that serves as a handler for multiple webhook events. The function should accept a request body containing different webhook events and validate the incoming data using Zod. Each webhook event type should have its own schema defined using Zod.

        The function should handle the following webhook events with example payloads:

        """
        ${webhooksBodies}
        """

        The generated code should include:

        -  A main function that takes the webhook request body as input.
        -  Zod schemas for each event type.
        -  Logic to handle each event based on the validated data.
        -  Appropriate error handling for invalid payloads.

        ---

        You can use this prompt to request the TypeScript code you need for handling webhook events with Zod validation.

        Return only the code and do not return \`\`\`typescript or any other markdown symbols, do not include any introduction or text before or after the code.
      `.trim(),
    })

    return NextResponse.json({ code: text }, { status: 201 })
  } catch (error) {
    console.error('Error generating handler:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate handler' },
      { status: 500 }
    )
  }
}
