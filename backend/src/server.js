aagerequire('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const { initWebSocketServer } = require('./ws/server');

// Routes and controllers
const internalRoutes = require('./routes/internal');
const mediaRoutes = require('./routes/media');
// const authRoutes = require('./routes/auth'); // if exists
const authController = require('./controllers/authController'); // assume functions

const app = express();
const server = http.createServer(app);

async function startServer() {
  try {
    await db.initDb();

    // Middleware
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }));
app.use(express.json({ limit: '10mb' }));
// serve static generated files (dev only – use signed URLs in prod)
app.use('/workers/output', express.static(path.join(__dirname, '..', '..', 'workers', 'output')));

    // Routes
    app.use('/internal', internalRoutes);
    app.use('/api/media', mediaRoutes);
    app.post('/api/generate', async (req, res) => {
      const { prompt, style_preset, persona_id } = req.body;
      const job_id = `gen_${Date.now()}`;
      console.log(`[Gen] Queued job ${job_id}: ${prompt} for persona ${persona_id}`);
      res.json({ 
        job_id, 
        status: 'queued', 
        estimatedTime: '30s',
        checkStatus: `/api/media/status/${job_id}`
      });
    });
    app.post('/api/auth/register', authController.register || ((req, res) => res.json({ message: 'Register stub' })));
    app.post('/api/auth/login', authController.login || ((req, res) => res.json({ message: 'Login stub', token: 'demo-token' })));
    app.get('/api/posts', async (req, res) => {
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      try {
        const rows = await db.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        res.json({ posts: rows });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Health
    app.get('/health', (req, res) => res.json({ status: 'OK', db: db.getClient ? 'PG' : 'SQLite' }));

    // WebSocket
    initWebSocketServer(server);

    const port = process.env.PORT || 3001;
    server.listen(port, () => {
      console.log(`[Server] Listening on port ${port}`);
    });

  } catch (err) {
    console.error('[Server] Startup error:', err);
    process.exit(1);
  }
}

startServer();

module.exports = server;

