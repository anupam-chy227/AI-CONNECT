# AIConnect Audit

## Summary
AIConnect is a compact monorepo for an AI-forward social playground that prototypes persona-driven media generation and sharing. The repository contains a frontend (React/Vite), a backend (Node/Express), and worker code for media generation. There are mission-style verification scripts and a handful of example payloads.

## Files Reviewed
- .gitignore
- docker-compose.yml
- docker-compose.prod.yml
- prototype.html
- README.md
- package.json
- gen_request.json
- ltr_model.json

## Current Observations
1. Repo layout matches a typical 3-service monorepo: `/frontend`, `/backend`, `/workers` (references in README and scripts). Verify scripts import `./backend/src/*` directly.
2. `docker-compose.yml` exposes `backend` (3001), `frontend` (5173) and `worker`, but does not include managed Postgres, Redis, or object storage services. Instead, backend mounts `dev.sqlite` and expects `PG_URL` envvar in some places.
3. No SQL migrations or DDL found in repo; several test scripts call `db.query()` and create tables ad-hoc. This makes schema management and reproducible deployments brittle.
4. There are backend services in `backend/src/services/*` (ltr, metrics, experiments, privacy_delete, media_cache, deepfake detector, provenance signer) but no centralized events/publisher module or websocket server implementation.
5. `dev.sqlite` appears in repo root and `docker-compose.yml` mounts `./backend/dev.sqlite:/app/dev.sqlite` — this indicates a local DB is used and may be checked into git. If present in git, it must be removed and added to `.gitignore`.

## Missing Items (high priority)
- Schema migrations and a `db` module that cleanly supports Postgres (production) and sqlite fallback (dev).
- Compose services for Postgres, Redis, and local S3/MinIO for object storage.
- Events/publisher and a realtime socket server (`/ws`) to broadcast `post.created` and other events.
- Internal endpoints (e.g., `/internal/posts/create`) for trusted service-to-service calls.
- Worker integration to auto-publish generated media into feed (current worker code not seen as calling internal endpoint).
- CI workflow for lint/build/test and smoke tests validating end-to-end generation→publish→ws flow.
- DB migration files and seeding scripts compatibility.

## Risks
- Committed `dev.sqlite` can leak sensitive data and makes DB state non-reproducible.
- No migration system → schema drift and production failures when moving from sqlite to Postgres.
- Missing storage service (S3/MinIO) increases risk of losing generated media if relying on local `uploads` volumes.
- Lack of internal auth and protected endpoints risks unauthorized publishing if endpoints are exposed without tokens.
- No moderation/approval pipeline documented; auto-publishing without moderation could surface unsafe content.

## Recommended Next Steps
1. Add `dev.sqlite` to `.gitignore` and open a PR removing it from git history (or instruct maintainers to purge it).
2. Add Postgres/Redis/MinIO services to docker-compose.* and provide an `/infra/docker` folder with Dockerfile skeletons for backend/worker/frontend.
3. Add migrations (`/backend/src/migrations/001_create_tables.sql`) and a `db.js` module that picks Postgres via `PG_URL` or sqlite fallback.
4. Implement an internal posts service + protected internal endpoint (`/internal/posts/create`) and a lightweight `events/publisher.js` that can be swapped for socket.io.
5. Update workers to POST to internal create endpoint after successful generation; implement retries and job status tracking.
6. Add `/api/media/status/:job_id` and static file serving (uploads or MinIO signed URLs).
7. Add `docs/env_vars.md` and `docs/safety.md` describing provenance schema and moderation thresholds.
8. Add minimal CI and smoke tests that run the full flow.

## Quick References (examples found)
- Mission verify scripts: `verify_mission_*.js` (seed data, call services)
- LTR scorer: `backend/src/services/ltr/score_api` (called by `test_ltr_score.js`)
- Example generator payload: `gen_request.json`

---

(continued below)
