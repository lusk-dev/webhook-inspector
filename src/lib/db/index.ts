import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Get the D1 database instance from Cloudflare Workers environment
export function getDb(env: { DB: D1Database }) {
  return drizzle(env.DB, { schema })
}

// Type exports for convenience
export type Database = ReturnType<typeof getDb>
export { schema }
