/**
 * verify_mission_13.js
 */
const experiments = require('./backend/src/services/experiment_service');

function verify() {
  console.log('[Verify Mission 13] Starting...');

  const users = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'];
  const experimentId = 'studio_v2_launch';

  console.log(`[Verify] Bucketing users for ${experimentId}:`);
  users.forEach(userId => {
    const variant = experiments.getVariant(userId, experimentId);
    experiments.logExposure(userId, experimentId, variant);
    console.log(` - User ${userId} -> Variant: ${variant}`);
  });

  // Verify consistency
  const v1_first = experiments.getVariant('user_consistent', 'studio_v2_launch');
  const v1_second = experiments.getVariant('user_consistent', 'studio_v2_launch');
  console.log(`[Verify] Consistency check: ${v1_first} === ${v1_second}`);

  if (v1_first === v1_second) {
    console.log('[Verify] MISSION 13 SUCCESS');
  } else {
    console.log('[Verify] MISSION 13 FAILED');
  }
  
  process.exit(0);
}

verify();
