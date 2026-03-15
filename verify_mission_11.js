/**
 * verify_mission_11.js
 */
const metrics = require('./backend/src/services/metrics_service');

function verify() {
  console.log('[Verify Mission 11] Starting...');

  // 1. Record requests
  metrics.recordRequest(100);
  metrics.recordRequest(200);
  metrics.recordRequest(300);
  
  const current = metrics.getMetrics();
  console.log('[Verify] Current Metrics:', current);

  // 2. Trigger high latency alert
  console.log('[Verify] Simulating latency spike...');
  metrics.initHist = Array(10).fill(600); // Hack to force average high
  for(let i=0; i<10; i++) metrics.recordRequest(700);
  
  // 3. Record failure
  metrics.recordGenJob(false);

  const finalMetrics = metrics.getMetrics();
  console.log('[Verify] Final Metrics:', finalMetrics);

  if (finalMetrics.avg_latency_ms > 500 && finalMetrics.gen_jobs_failed === 1) {
    console.log('[Verify] MISSION 11 SUCCESS');
  } else {
    console.log('[Verify] MISSION 11 FAILED');
  }
  
  process.exit(0);
}

verify();
