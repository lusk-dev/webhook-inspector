# Migration Guide: Monorepo → Next.js + Cloudflare Workers

This document details the complete migration from the original pnpm monorepo architecture to a unified Next.js application deployable on Cloudflare Workers.

## 🔄 Migration Summary

### Original Architecture
- **Structure**: pnpm monorepo with 2 packages (`api/` and `web/`)
- **Backend**: Fastify with PostgreSQL database
- **Frontend**: React SPA with Vite + TanStack Router
- **Deployment**: Docker + traditional Node.js server

### New Architecture
- **Structure**: Single Next.js application with App Router
- **Backend**: Next.js API Routes with Edge Runtime
- **Frontend**: Next.js pages with React Server Components
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Workers (serverless, globally distributed)

## 📝 Changes Made

### 1. Project Structure

**Before:**
```
webhook-inspector/
├── api/              # Fastify backend
├── web/              # React SPA
└── package.json      # Workspace config
```

**After:**
```
webhook-inspector/
├── src/              # Source code directory
│   ├── app/          # Next.js App Router (frontend + API)
│   ├── components/   # React components
│   ├── lib/          # Database, schemas, utilities
│   └── styles/       # Global styles
└── package.json      # Single package
```

### 2. Database Migration

| Aspect | Before | After |
|--------|--------|-------|
| **Database** | PostgreSQL (Docker) | Cloudflare D1 (SQLite) |
| **ORM Dialect** | `drizzle-orm/pg-core` | `drizzle-orm/sqlite-core` |
| **Connection** | `postgres` package | D1 binding |
| **JSON Fields** | `jsonb()` | `text(mode: 'json')` |
| **Timestamps** | `timestamp()` | `integer(mode: 'timestamp')` |

**Schema Changes:**
```typescript
// Before (PostgreSQL)
import { pgTable, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const webhooks = pgTable('webhooks', {
  headers: jsonb().$type<Record<string, string>>(),
  createdAt: timestamp().notNull().defaultNow(),
})

// After (SQLite/D1)
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const webhooks = sqliteTable('webhooks', {
  headers: text('headers', { mode: 'json' }).$type<Record<string, string>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

### 3. API Routes Migration

**Before (Fastify):**
```typescript
// api/src/routes/list-webhooks.ts
export const listWebhooks: FastifyPluginAsyncZod = async (app) => {
  app.get('/api/webhooks', { schema: {...} }, async (request, reply) => {
    const result = await db.select().from(webhooks)
    return reply.send({ webhooks: result })
  })
}
```

**After (Next.js API Route):**
```typescript
// src/app/api/webhooks/route.ts
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const env = process.env as unknown as { DB: D1Database }
  const db = getDb(env)
  const result = await db.select().from(webhooks)
  return NextResponse.json({ webhooks: result })
}
```

**Migrated Routes:**
- `POST /api/capture/*` → `src/app/api/capture/[...path]/route.ts`
- `GET /api/webhooks` → `src/app/api/webhooks/route.ts`
- `GET /api/webhooks/:id` → `src/app/api/webhooks/[id]/route.ts`
- `DELETE /api/webhooks/:id` → `src/app/api/webhooks/[id]/route.ts`
- `POST /api/generate` → `src/app/api/generate/route.ts`

### 4. Frontend Migration

**Before (TanStack Router):**
```typescript
// web/src/routes/webhooks.$id.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/webhooks/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <WebhookDetails id={id} />
}
```

**After (Next.js App Router):**
```typescript
// src/app/webhooks/[id]/page.tsx
export default async function WebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WebhookDetails id={id} />
}
```

**Component Updates:**
- Added `'use client'` directive to components using hooks
- Changed `Link` from `@tanstack/react-router` to `next/link`
- Updated `to="/path"` to `href="/path"`
- Fixed API URLs from `http://localhost:3333` to relative paths

### 5. Configuration Files

**New Files Created:**
- `next.config.ts` - Next.js configuration with Edge Runtime
- `wrangler.toml` - Cloudflare Workers configuration
- `src/app/layout.tsx` - Root layout with providers
- `src/components/providers.tsx` - Client-side query provider
- `src/lib/db/index.ts` - D1 database connection
- `.gitignore` - Updated for Next.js and Cloudflare

**Modified Files:**
- `package.json` - Consolidated dependencies, new scripts
- `drizzle.config.ts` - Updated for SQLite dialect
- `tsconfig.json` - Added Next.js and Cloudflare types

### 6. Dependencies

**Removed:**
- `@fastify/cors`, `@fastify/swagger`, `fastify`
- `@tanstack/react-router`, `@tanstack/router`
- `vite`, `@vitejs/plugin-react`
- `postgres`, `pg`
- `docker-compose.yml`

**Added:**
- `next` (^15.3.2)
- `@cloudflare/next-on-pages` (^1.13.7)
- `@cloudflare/workers-types` (^4.20250214.0)
- `wrangler` (^4.1.0)

**Kept:**
- `react`, `react-dom` (^19.1.1)
- `drizzle-orm`, `drizzle-kit`
- `@tanstack/react-query`
- `tailwindcss` (4.1.14)
- `radix-ui` components
- `zod`, `date-fns`, `lucide-react`

## 🚀 Next Steps

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Create D1 Database
```bash
npx wrangler d1 create webhook_db
# Copy the database_id and update wrangler.toml
```

### 3. Run Migrations
```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Start Development
```bash
# Option 1: Next.js dev server
pnpm dev

# Option 2: Cloudflare Pages dev (recommended)
pnpm pages:dev
```

### 5. Test the Application
- Verify the UI loads at `http://localhost:3000` (or `:8788` for Cloudflare dev)
- Test webhook capture at `/api/capture/test`
- Check webhooks list and detail pages
- Test AI handler generation feature

### 6. Deploy to Cloudflare
```bash
pnpm pages:build
pnpm pages:deploy
```

## ✅ Verification Checklist

- [ ] Dependencies installed successfully
- [ ] D1 database created and ID updated in `wrangler.toml`
- [ ] Database migrations applied
- [ ] Development server starts without errors
- [ ] Can access home page
- [ ] Can capture a test webhook
- [ ] Webhooks list displays captured webhooks
- [ ] Can view webhook details
- [ ] Can delete webhooks
- [ ] AI handler generation works (requires Google AI API key)
- [ ] Build completes successfully (`pnpm pages:build`)
- [ ] Deployment to Cloudflare succeeds

## 🐛 Known Issues & Solutions

### Issue: TypeScript errors about D1Database
**Solution**: Ensure `@cloudflare/workers-types` is installed and added to tsconfig.json types array.

### Issue: Database binding not found in development
**Solution**: Use `pnpm pages:dev` instead of `pnpm dev` for full Cloudflare emulation.

### Issue: API routes return 500 errors
**Solution**: Verify D1 database is created and migrations are applied. Check Wrangler logs.

### Issue: Build fails with Edge Runtime incompatibility
**Solution**: Ensure all API routes have `export const runtime = 'edge'` declared.

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)

## 🗑️ Cleanup (Optional)

After confirming the migration works:

```bash
# Remove old monorepo directories
rm -rf api/
rm -rf web/

# Remove from .gitignore
# Edit .gitignore and remove the last two lines
```

## 💡 Tips

1. **Local Development**: Use `pnpm pages:dev` for the best local experience that matches production
2. **Database**: D1 is SQLite-based, so SQL queries are slightly different from PostgreSQL
3. **Edge Runtime**: Not all Node.js APIs are available; use Web APIs instead
4. **Caching**: Cloudflare Workers have aggressive caching; use cache headers appropriately
5. **Logs**: Check Cloudflare dashboard for production logs and analytics

## 📞 Support

If you encounter issues:
1. Check the [README.md](./README.md) for detailed setup instructions
2. Review Cloudflare Workers logs in the dashboard
3. Verify all environment variables and bindings are set correctly
4. Ensure D1 database migrations are applied to both local and production databases
