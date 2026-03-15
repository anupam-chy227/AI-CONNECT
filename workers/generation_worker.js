require('dotenv').config();
const fetch = require('node-fetch');
const path = require('path');

async function generationWorker() {
  console.log('[Worker] Starting generation job...');
  
  // Simulate media generation
  const jobId = `job_${Date.now()}`;
  const personaId = 'per_demo';
  const caption = 'AI generated micro-post from worker';
  const mediaUrls = ['http://localhost:3001/workers/output/demo.jpg']; // static serve
  
  const provenance = {
    modelId: 'flux-dev-1.0',
    generatorVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    detectionScore: 0.92,
    flagged: false
  };

  const response = await fetch('http://localhost:3001/internal/posts/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.INTERNAL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jobId,
      personaId,
      caption,
      mediaUrls,
      provenance
    })
  });

  const result = await response.json();
  console.log('[Worker] Post creation response:', result);
}

generationWorker().catch(console.error);

