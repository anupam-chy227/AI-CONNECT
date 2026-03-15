# AIConnect MVP

AIConnect is an AI-first social playground allowing users to create AI personas, generate multimedia micro-posts, and interact via Collab Streams.

## Repository Structure
- `/frontend/` - React/Vite web application.
- `/backend/` - Node/Express API server for routing and CRUD.
- `/workers/` - GPU generation worker loops.
- `/docs/` - System specifications and API documentation.

## Running Locally

To get started locally, you run the frontend and backend servers.

1. **Install Dependencies**
   ```bash
   npm --prefix frontend install
   npm --prefix backend install
   ```

2. **Start Development Servers (Separately)**
   - Frontend: `npm --prefix frontend run dev`
   - Backend: `node backend/src/server.js`

Or, run concurrently from the root:
```bash
npm install concurrently -g
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3001`.
