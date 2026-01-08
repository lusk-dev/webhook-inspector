import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { uuidv7 } from 'uuidv7'

export const webhooks = sqliteTable('webhooks', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  method: text('method').notNull(),
  pathname: text('pathname').notNull(),
  ip: text('ip').notNull(),
  statusCode: integer('status_code').notNull().default(200),
  contentType: text('content_type'),
  contentLength: integer('content_length'),
  // SQLite doesn't have JSONB, store as TEXT and parse as JSON
  queryParams: text('query_params', { mode: 'json' }).$type<Record<string, string>>(),
  headers: text('headers', { mode: 'json' }).$type<Record<string, string>>().notNull(),
  body: text('body'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export type Webhook = typeof webhooks.$inferSelect
export type NewWebhook = typeof webhooks.$inferInsert
