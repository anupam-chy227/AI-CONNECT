/**
 * verify_mission_9.js
 */
const privacy = require('./backend/src/services/privacy_delete');
const db = require('./backend/src/db');

async function verify() {
  console.log('[Verify Mission 9] Starting...');

  const userId = 'pur_test_user_789';
  
  try {
    // 1. Seed data for the test user
    console.log('[Verify] Seeding data for deletion test...');
    await db.query("INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
                   [userId, 'purgeme', 'purge@example.com', 'pwd']);
    await db.query("INSERT INTO personas (id, user_id, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                   ['per_purge', userId, 'Temporal Persona']);
    await db.query("INSERT INTO posts (id, persona_id, caption) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                   ['pst_purge', 'per_purge', 'This post will disappear.']);
    
    // 2. Call purge
    const result = await privacy.purgeUser(userId);
    console.log('[Verify] Purge result:', result);

    // 3. Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const personaCheck = await db.query('SELECT * FROM personas WHERE user_id = $1', [userId]);
    
    if (userCheck.rows.length === 0 && personaCheck.rows.length === 0) {
      console.log('[Verify] MISSION 9 SUCCESS: Data purged.');
    } else {
      console.log('[Verify] MISSION 9 FAILED: Artifacts remain.');
    }
  } catch (err) {
    console.error('[Verify] Error:', err);
  } finally {
    process.exit(0);
  }
}

verify();
