# AIConnect Vercel Deployment Guide

## Quick Start

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

The CLI will guide you through:
- Confirming project name
- Framework detection (should detect Node.js/React)
- Environment setup

### 4. Configure Environment Variables

After first deployment, go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these required variables:

| Variable | Value | Example |
|----------|-------|---------|
| `PG_URL` | PostgreSQL connection string | `postgresql://user:pass@db.host/aiconnect` |
| `JWT_SECRET` | Secret for JWT signing | Generate: `openssl rand -base64 32` |
| `WS_SECRET` | Secret for WebSocket auth | Generate: `openssl rand -base64 32` |
| `INTERNAL_TOKEN` | Secret for internal API calls | Generate: `openssl rand -base64 32` |
| `FRONTEND_URL` | Your Vercel deployment URL | `https://myapp.vercel.app` |
| `VITE_WS_URL` | WebSocket URL | `wss://myapp.vercel.app` |
| `ENVIRONMENT` | Environment name | `production` |

### 5. Database Setup

Choose one:

**Option A: Railway (Recommended)**
1. Go to [railway.app](https://railway.app)
2. Create PostgreSQL plugin
3. Copy connection string to `PG_URL`

**Option B: Render**
1. Go to [render.com](https://render.com)
2. Create PostgreSQL database
3. Copy connection string to `PG_URL`

**Option C: Neon**
1. Go to [neon.tech](https://neon.tech)
2. Create database
3. Copy connection string to `PG_URL`

### 6. Redeploy with Env Vars
```bash
vercel --prod
```

## Architecture on Vercel

- **Frontend**: Static React app deployed to Vercel's CDN (auto-built from `frontend/` folder)
- **Backend**: Node.js Express API running as Vercel Functions
- **Database**: External PostgreSQL instance (Railway/Render/Neon)
- **WebSocket**: Supported via Socket.io on Vercel (persistent connections work)

## Troubleshooting

### Build Fails
```bash
vercel logs
```

### Environment Variables Not Loading
- Ensure variables are marked as **available to all environments** (Production, Preview, Development)
- Redeploy after adding variables

### Database Connection Error
- Verify `PG_URL` is accessible from Vercel (check IP allowlist if using managed DB)
- Test locally: `psql $PG_URL -c "SELECT 1"`

### WebSocket Connection Issues
- Check `VITE_WS_URL` matches your Vercel domain
- Verify frontend proxy settings in `frontend/vite.config.js`

## Monitoring

View logs:
```bash
vercel logs [project-url]
```

## Rolling Back

```bash
vercel rollback
```

## Custom Domain

In Vercel Dashboard → Project Settings → Domains:
1. Add your custom domain
2. Update `FRONTEND_URL` and `VITE_WS_URL` env vars
3. Redeploy

---

**Need help?** Check [Vercel Docs](https://vercel.com/docs) or [AIConnect Issues](https://github.com/your-org/aiconnect/issues)
