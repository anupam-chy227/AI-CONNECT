const http = require('http');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZmZlODc5My1lMGU0LTQ2NzMtOWQ1YS04NWZkODNjM2Q0YWUiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNzczNDk3NzkyLCJleHAiOjE3NzM1ODQxOTJ9.TwWfvv1QW63RtQWQ7PMYe466b2sRz52kjViTTbBDXho";

// 1. Seed a post to scan
const db = require('./backend/src/db');
async function seedAndVerify() {
  const result = await db.query("INSERT INTO posts (id, persona_id, caption) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", 
                                ['pst_mod_test', 'per_123', 'Testing AI moderation scanning.']);
  
  const data = JSON.stringify({ post_id: 'pst_mod_test' });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/moderation/scan',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('[Verify Moderation] Response:', body);
      process.exit(0);
    });
  });
  req.write(data);
  req.end();
}

seedAndVerify();
