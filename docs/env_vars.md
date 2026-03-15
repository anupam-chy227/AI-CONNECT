# Environment Variables

## Development (docker-compose.yml)

All dev values are baked into compose file with sensible defaults.

### Key Variables

- PG_URL: postgresql://aiconnect:devpass123@postgres:5432/aiconnect_dev
- REDIS_URL: redis://redis:6379
- S3_BUCKET: aiconnect-uploads
- JWT_SECRET: dev-secret-key (set via env)
- INTERNAL_TOKEN: internal-dev-token (set via env)
- WS_SECRET: ws-dev-secret (set via env)
- NODE_ENV: development

## Local Development Quick Start

`ash
docker-compose up --build
`

Access services:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- MinIO: http://localhost:9001 (user: minioadmin, pass: minioadmin)
- Postgres: localhost:5432 (user: aiconnect, pass: devpass123)
- Redis: localhost:6379

## Production Setup

Set env vars before docker-compose -f docker-compose.prod.yml up:
- PG_URL, REDIS_URL, S3_BUCKET, MINIO_ENDPOINT
- JWT_SECRET, INTERNAL_TOKEN, WS_SECRET (generate strong random strings)
- DB_USER, DB_PASSWORD, REDIS_PASSWORD
- BACKEND_URL
