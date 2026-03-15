# Vercel Deployment Checklist

## Pre-Deployment ✅
- [ ] Code committed and pushed to GitHub
- [ ] All tests passing locally (`npm run dev`)
- [ ] Environment variables documented in `VERCEL_DEPLOYMENT.md`
- [ ] Database backup created (if updating existing deployment)

## Vercel Dashboard Setup 🚀
- [ ] Project connected to GitHub repository
- [ ] Build settings verified:
  - Framework: Node.js + React
  - Build Command: `npm run build:vercel`
  - Output Directory: `frontend/dist`
- [ ] Environment variables configured:
  - [ ] PG_URL (PostgreSQL connection string)
  - [ ] JWT_SECRET
  - [ ] WS_SECRET
  - [ ] INTERNAL_TOKEN
  - [ ] FRONTEND_URL
  - [ ] VITE_WS_URL
  - [ ] ENVIRONMENT=production

## Database Setup 🗄️
- [ ] PostgreSQL database created (Railway/Render/Neon)
- [ ] Database migrations applied
- [ ] Connection string tested locally
- [ ] PG_URL added to Vercel environment variables

## Secrets Generation 🔐
```bash
# Generate secure secrets:
openssl rand -base64 32  # For JWT_SECRET, WS_SECRET, INTERNAL_TOKEN
```

## Deployment 🎯
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

## Post-Deployment Verification ✓
- [ ] Frontend loads at `https://your-vercel-url`
- [ ] `/api/health` returns `{"status":"OK"}`
- [ ] WebSocket connects: Test with `node verify_ws.js`
- [ ] Posts feed loads: `GET /api/posts`
- [ ] Can create generation job: `POST /api/generate`

## Monitoring & Logs 📊
```bash
# View logs
vercel logs [project-url]

# Monitor in Vercel Dashboard
# Go to: Deployments → Select deployment → Logs
```

## Rollback (if needed) ⚠️
```bash
vercel rollback
```

## Domain & SSL 🔗
- [ ] Custom domain added (if applicable)
- [ ] SSL certificate auto-provisioned (automatic on Vercel)
- [ ] Update FRONTEND_URL and VITE_WS_URL env vars

---

**Status**: Ready for deployment ✓
