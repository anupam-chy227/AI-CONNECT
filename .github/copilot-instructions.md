# AIConnect Copilot Instructions

## Project Overview
AIConnect is an AI-first social platform for creating AI personas, generating multimedia posts, and collaborative interactions. A three-service monorepo: **Frontend** (React/Vite, port 5173) ↔ **Backend** (Node/Express, port 3001) ↔ **Workers** (GPU generation). Database layer supports PostgreSQL (production) with automatic SQLite fallback (dev.sqlite).

## Architecture

### Service Boundaries & Communication
- **Frontend** (`/frontend`): React/Vite SPA; REST calls to `/api/*`, WebSocket to port 3001 via `socket.io-client`
  - Realtime client: [realtime.js](../frontend/src/services/realtime.js) — JWT auth via Socket.io `auth` object, auto-reconnect (1–5s delays)
  - Events dispatched: `post:created`, `post:updated`, `post:deleted`, `post:flagged`
- **Backend** (`/backend/src`): Express API and Socket.io server on same HTTP instance
  - Route groups: `/internal/*` (health), `/api/auth/*` (register/login), `/api/media/*` (generation), `/api/posts` (feed)
  - WebSocket server: [ws/server.js](../backend/src/ws/server.js) — JWT verification middleware, event subscriptions via [publisher.js](../backend/src/events/publisher.js)
- **Database**: [db.js](../backend/src/db.js) auto-detects `PG_URL` env var; falls back to SQLite (dev.sqlite) if unset or connection fails
  - Single async interface: `db.query(sql, params)` works for both PostgreSQL (`$1, $2`) and SQLite (auto-converts to `?`)
  - Foreign keys enforced; cascade deletes configured for users → personas → posts

### Data Model Hierarchy
```
users (id: UUID) → personas (user_id FK) → posts (persona_id FK)
                      ↓                          ↓
                   media (post_id FK)    job_status (tracks gen jobs)
```
**ID Prefixes**: `usr_` (users), `per_` (personas), `pst_` (posts), `pre_` (presets)  
**Idempotency Pattern**: All INSERT statements use `ON CONFLICT DO NOTHING` for safe re-execution.

### Key Backend Service Modules
- [postService.js](../backend/src/services/postService.js): Create/update posts, publish events
- `privacy_delete`: Cascading user purge (GDPR compliance)
- `ltr/score_api`: Learn-to-rank post scoring (features: visual_score, style_score, recency_hours)
- `deepfake_detector`, `provenance_signer`: Media authenticity
- `experiment_service`: Deterministic user-to-variant bucketing
- [publisher.js](../backend/src/events/publisher.js): In-memory pub/sub for WebSocket broadcasts

## Development Workflow

### Local Development (no Docker)
```bash
npm run install:all    # Install frontend & backend deps
npm run dev            # Start both servers concurrently (5173 & 3001)
```
**Requirements**: Node 16+, `npm install -g concurrently`, PostgreSQL running (or auto-fallback to SQLite)

### Docker Compose
```bash
docker-compose up                                    # Dev: Postgres + Redis + hot-reload mounts
FRONTEND_URL=http://localhost:5173 docker-compose up # Override CORS origin
docker-compose -f docker-compose.prod.yml up        # Prod: no volumes, optimized images
```
**Troubleshooting**: Backend logs `[DB]` prefix; if startup hangs, check Postgres health.

### Verification & Test Scripts Pattern
Standalone Node scripts (e.g., `verify_mission_9.js`, `seed_marketplace.js`) that:
1. Import backend modules directly: `require('./backend/src/db')`, `require('./backend/src/services/privacy_delete')`
2. Seed test data via parameterized queries
3. Invoke service functions or HTTP calls to `localhost:3001`
4. Assert outcomes, then `process.exit(0)` or `process.exit(1)`

**Example**:
```javascript
const db = require('./backend/src/db');
const privacy = require('./backend/src/services/privacy_delete');
await db.query('INSERT INTO users (...) VALUES ($1, $2)', [userId, username]);
const result = await privacy.purgeUser(userId);
// Assert cascading delete worked
process.exit(result.success ? 0 : 1);
```

## Project Conventions

### Console Logging
Services log with **prefixes** for terminal filtering:  
`[DB]`, `[Server]`, `[WS]`, `[Verify]`, `[Seed]`, `[Realtime]`, `[PostService]`, `[LTR Test]`

Example: `console.log('[PostService] Creating post:', postId);`

### Database Query Pattern
- **Always parameterized**: `db.query('SELECT * FROM posts WHERE id = $1', [postId])`
- PostgreSQL `$1, $2, ...` syntax; SQLite auto-converts to `?`
- Test both backends: dev.sqlite (auto-initialized), and Postgres (docker-compose or external)

### API & WebSocket Patterns
- **HTTP endpoints** return JSON only (except `/health` plain-text "OK")
- **Bearer token** format: `Authorization: Bearer <JWT>` with claims `{userId, username, iat, exp}`
- **Socket.io auth**: Pass token in connection auth object: `io(url, {auth: {token}})`
- **Event payload structure**: `{id, persona_id, caption, mediaUrls, provenance, published_at}`

### Error Handling
- Backend catch blocks log full error and exit: `console.error('[Module]', err.message)` + `process.exit(1)`
- Services throw or return error objects; controllers handle HTTP responses
- Test scripts: success → `process.exit(0)`, failure → `process.exit(1)` with error log

## Integration Points & Data Flows

### Creating & Publishing a Post
1. Frontend POST `/api/media/*` (image/video generation) → Backend queues job
2. Worker consumes queue, generates assets → uploads to `/backend/uploads`
3. Backend [postService.createPost()](../backend/src/services/postService.js) creates row + media entries
4. Service publishes `post.created` event via [publisher.js](../backend/src/events/publisher.js)
5. WebSocket broadcasts to all connected clients; frontend updates feed

### User Deletion (GDPR)
- Call `privacy.purgeUser(userId)` → deletes user row
- PostgreSQL CASCADE deletes personas → CASCADE deletes posts → CASCADE deletes media
- Cascades enforced by DB foreign key constraints

### Marketplace Transactions
- Presets are static inventory (preset_id, name, price)
- Purchase creates `transactions` row (user_id, preset_id, amount)
- No inventory tracking; unlimited supply

### Realtime Post Events
- Backend emits via `socket.emit('post:created', eventData)`
- [realtime.js](../frontend/src/services/realtime.js) listens: `socket.on('post:created', handleEvent)`
- Dispatch custom DOM events for React components to subscribe

## Common Implementation Patterns

### Adding an API Endpoint
1. Create route function in `/backend/src/routes/newEndpoint.js`
2. Export async handler: `module.exports = async (req, res) => { ... }`
3. Register in [server.js](../backend/src/server.js): `app.post('/api/newEndpoint', routeHandler)`
4. Log with prefix: `console.log('[NewEndpoint] Request:', req.body)`

### Adding a Database Table
1. Write `CREATE TABLE` in [migrations/001_create_tables.sql](../backend/src/migrations/001_create_tables.sql) or via `db.query()` in service
2. Seed test data in verification script: `await db.query('INSERT INTO newtable (...) VALUES ($1, $2)', [val1, val2])`
3. Run migrations on startup: `db.initDb()` auto-creates missing tables (SQLite) or assumes Postgres schema is pre-migrated

### Adding a Realtime Event
1. Backend service publishes: `publisher.publish('event.name', {payload})`
2. WebSocket server subscribes in [ws/server.js](../backend/src/ws/server.js): `publisher.subscribe('event.name', (data) => socket.emit('eventName', data))`
3. Frontend listens in [realtime.js](../frontend/src/services/realtime.js): `socket.on('eventName', handler)`
4. React component subscribes: `window.addEventListener('eventName', handleCustomEvent)`

### Service Module Template
```javascript
// /backend/src/services/exampleService.js
const db = require('../db');
module.exports = {
  create: async (data) => {
    try {
      const result = await db.query('INSERT INTO table (...) VALUES ($1, $2) RETURNING *', [data.a, data.b]);
      console.log('[ExampleService] Created:', result[0]);
      return result[0];
    } catch (err) {
      console.error('[ExampleService]', err.message);
      throw err;
    }
  }
};
```

## Key Files Quick Reference
- **Routing**: [server.js](../backend/src/server.js) (main express app + WebSocket init)
- **Database**: [db.js](../backend/src/db.js) (PG/SQLite abstraction)
- **Realtime**: [ws/server.js](../backend/src/ws/server.js) (Socket.io server), [realtime.js](../frontend/src/services/realtime.js) (client)
- **Post Logic**: [postService.js](../backend/src/services/postService.js), [publisher.js](../backend/src/events/publisher.js)
- **Migration**: [migrations/001_create_tables.sql](../backend/src/migrations/001_create_tables.sql)
- **Config Fixtures**: ltr_model.json, gen_request.json, register_request.json (root level)

## Deployment

### Vercel (Production)
1. Connect GitHub repo to Vercel dashboard
2. Set environment variables: `PG_URL`, `JWT_SECRET`, `WS_SECRET`, `INTERNAL_TOKEN`, `FRONTEND_URL`, `VITE_WS_URL`
3. Use managed PostgreSQL (Railway, Render, or Neon)
4. Deploy: `vercel --prod`
- Frontend automatically builds from `/frontend` (static)
- Backend runs as Vercel Functions (Node runtime)
- See [DEPLOY_VERCEL.md](../DEPLOY_VERCEL.md) for detailed guide

### Docker Compose (Staging/Local)
```bash
docker-compose up  # Includes Postgres + Redis + hot-reload
```

### Required Environment Variables
- `PG_URL`: PostgreSQL connection string (production must use managed DB)
- `JWT_SECRET`: JWT signing secret (generate: `openssl rand -base64 32`)
- `WS_SECRET`: WebSocket auth secret
- `INTERNAL_TOKEN`: Internal API token for workers
- `FRONTEND_URL`: Frontend deployment URL (for CORS)
- `VITE_WS_URL`: WebSocket endpoint (wss://... for HTTPS)
```
