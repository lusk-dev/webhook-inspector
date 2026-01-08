# Webhook Inspector - Next.js + Cloudflare Workers

A webhook inspector application built with Next.js, deployed on Cloudflare Workers with D1 database.

## 🚀 Architecture

- **Framework**: Next.js 15 with App Router
- **Runtime**: Cloudflare Workers (Edge Runtime)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + custom components
- **Data Fetching**: TanStack Query (React Query)
- **AI Integration**: Google Gemini via Vercel AI SDK

## 📁 Project Structure

```
webhook-inspector/
├── src/                      # Source code
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API routes (Edge Runtime)
│   │   │   ├── capture/[...path]/route.ts  # Webhook capture endpoint
│   │   │   ├── webhooks/route.ts           # List webhooks
│   │   │   ├── webhooks/[id]/route.ts      # Get/Delete webhook
│   │   │   └── generate/route.ts           # AI handler generation
│   │   ├── webhooks/[id]/page.tsx         # Webhook detail page
│   │   ├── layout.tsx        # Root layout with providers
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── sidebar.tsx
│   │   ├── webhooks-list.tsx
│   │   └── webhook-details.tsx
│   ├── lib/                  # Utilities and configurations
│   │   ├── db/               # Database setup
│   │   │   ├── schema.ts     # Drizzle schema (SQLite)
│   │   │   └── index.ts      # Database connection
│   │   └── schemas/          # Zod validation schemas
│   │       └── webhooks.ts
│   └── styles/               # Global styles
│       └── globals.css
├── drizzle/                  # Database migrations
│   └── migrations/
├── next.config.ts            # Next.js configuration
├── wrangler.toml             # Cloudflare Workers config
├── drizzle.config.ts         # Drizzle Kit configuration
└── package.json

```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm 10.15.0 (managed via packageManager field)
- Cloudflare account (for deployment)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create Cloudflare D1 Database

```bash
# Create D1 database
npx wrangler d1 create webhook_db

# Copy the database_id from the output and update wrangler.toml
# Replace database_id = "" with the actual ID
```

### 3. Generate and Run Database Migrations

```bash
# Generate migrations from schema
pnpm db:generate

# Apply migrations locally
pnpm db:migrate

# Or apply to production database
pnpm db:migrate:prod
```

### 4. Set Up Environment Variables

Create a `.dev.vars` file for local development:

```env
# Add any environment variables here if needed
# Example: API keys, external service URLs, etc.
```

## 🧑‍💻 Development

### Run Development Server

```bash
# Standard Next.js dev server (without Cloudflare Workers emulation)
pnpm dev

# OR run with Cloudflare Pages dev server (recommended for testing)
pnpm pages:dev
```

The application will be available at:
- Next.js dev: `http://localhost:3000`
- Cloudflare Pages dev: `http://localhost:8788`

### Database Management

```bash
# Generate new migration after schema changes
pnpm db:generate

# Apply migrations locally
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Apply migrations to production
pnpm db:migrate:prod
```

### Code Formatting

```bash
# Format code with Biome
pnpm format

# Type check
pnpm typecheck
```

## 📦 Deployment to Cloudflare Workers

### Option 1: Deploy via Wrangler CLI

```bash
# Build for Cloudflare Pages
pnpm pages:build

# Deploy to Cloudflare
pnpm pages:deploy
```

### Option 2: Deploy via Cloudflare Dashboard

1. Build the project:
   ```bash
   pnpm pages:build
   ```

2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)

3. Navigate to **Workers & Pages** → **Create Application** → **Pages**

4. Connect your Git repository or upload the `.vercel/output/static` directory

5. Configure build settings:
   - **Build command**: `pnpm pages:build`
   - **Build output directory**: `.vercel/output/static`

6. Add environment bindings:
   - **D1 Database**: Bind `webhook_db` as `DB`

7. Deploy!

### Environment Variables for Production

Set these in Cloudflare Dashboard under **Settings** → **Environment Variables**:

- Any API keys or secrets needed by your application
- Google AI API key (if using AI features): `GOOGLE_GENERATIVE_AI_API_KEY`

## 🔧 Configuration Files

### `wrangler.toml`

Cloudflare Workers configuration with D1 database binding:

```toml
name = "webhook-inspector"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "webhook_db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### `next.config.ts`

Next.js configuration for Edge Runtime compatibility:

```typescript
experimental: {
  runtime: 'edge',
}
```

### `drizzle.config.ts`

Drizzle ORM configuration for SQLite/D1:

```typescript
dialect: 'sqlite',
schema: './lib/db/schema.ts',
out: './drizzle/migrations',
```

## 📡 API Endpoints

### Capture Webhook
- **POST/GET/PUT/PATCH/DELETE** `/api/capture/*`
- Captures any incoming webhook request with full details
- Returns: `{ id: string }`

### List Webhooks
- **GET** `/api/webhooks?limit=20&cursor=<webhook_id>`
- Lists captured webhooks with pagination
- Returns: `{ webhooks: [], nextCursor: string | null }`

### Get Webhook
- **GET** `/api/webhooks/:id`
- Retrieves a specific webhook by ID
- Returns: Full webhook object with headers, body, etc.

### Delete Webhook
- **DELETE** `/api/webhooks/:id`
- Deletes a webhook by ID
- Returns: 204 No Content

### Generate Handler (AI)
- **POST** `/api/generate`
- Generates TypeScript webhook handler code using AI
- Body: `{ webhookIds: string[] }`
- Returns: `{ code: string }`

## 🧩 Key Features

- **Real-time Webhook Capture**: Capture any HTTP method with full request details
- **Infinite Scroll Pagination**: Efficiently browse through thousands of webhooks
- **AI-Powered Code Generation**: Generate TypeScript handlers from webhook payloads
- **Dark Theme UI**: Modern, accessible interface with Radix UI components
- **Edge Runtime**: Fast, globally distributed on Cloudflare's network
- **SQLite Database**: Reliable, serverless D1 database with no connection overhead

## 🔄 Migration from Original Architecture

This project was migrated from a pnpm monorepo (Fastify API + Vite React SPA) to a unified Next.js application:

### Changes Made:

1. **Database**: PostgreSQL → Cloudflare D1 (SQLite)
   - Changed Drizzle from `pg-core` to `sqlite-core`
   - Replaced `jsonb()` with `text(mode: 'json')`
   - Regenerated migrations for SQLite

2. **API Layer**: Fastify → Next.js API Routes
   - Converted route handlers to Next.js route.ts format
   - Updated to Edge Runtime
   - Maintained Zod validation

3. **Frontend**: TanStack Router → Next.js App Router
   - Migrated file-based routing
   - Updated Link components
   - Added 'use client' directives where needed

4. **Deployment**: Docker + Node.js → Cloudflare Workers
   - Configured `@cloudflare/next-on-pages`
   - Set up D1 database bindings
   - Removed Docker dependencies

## 🐛 Troubleshooting

### Build Issues

If you encounter build errors:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

### Database Issues

If database migrations fail:

```bash
# Check D1 database exists
npx wrangler d1 list

# Verify database ID in wrangler.toml matches
npx wrangler d1 info webhook_db

# Reset local database (development only)
rm -rf .wrangler/state
pnpm db:migrate
```

### Cloudflare Deployment Issues

- Ensure D1 database is created and bound in wrangler.toml
- Verify `database_id` is correct
- Check that Edge Runtime compatibility is set
- Review Cloudflare Workers logs in dashboard

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
