# AIConnect Vercel Deployment - Environment Variables

## Required Environment Variables (set in Vercel Dashboard)

# Database
PG_URL=postgresql://user:password@host:5432/aiconnect_prod

# Security
JWT_SECRET=your-secure-jwt-secret-change-this
WS_SECRET=your-secure-ws-secret-change-this
INTERNAL_TOKEN=your-secure-internal-token

# URLs
FRONTEND_URL=https://your-vercel-deployment.vercel.app
VITE_WS_URL=wss://your-vercel-deployment.vercel.app

# Features
AUTO_PUBLISH_MODE=disabled
ENVIRONMENT=production

# Optional: Worker Integration
REDIS_URL=redis://host:port  # Optional, for job queue

## Setup Instructions

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel Dashboard:
   - Project Settings → Environment Variables
   - Add each variable from above

4. For Production Database:
   - Use managed PostgreSQL (e.g., Railway, Render, Neon)
   - Update PG_URL with connection string

5. Deploy again:
   ```bash
   vercel --prod
   ```

## Notes
- Frontend builds as static site (frontend/dist)
- Backend runs on Vercel Functions (Node runtime)
- WebSocket support available via Socket.io on Vercel
- Max function duration: 60 seconds (adjust in vercel.json if needed)
