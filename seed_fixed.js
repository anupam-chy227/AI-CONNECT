const db = require('./backend/src/db');

async function seedFixed() {
  console.log('[Seed] Seeding fixed data...');
  try {
    // Add presets table if missing
    await db.query('CREATE TABLE IF NOT EXISTS presets (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), creator_id VARCHAR(255), price INT, is_public BOOLEAN)');
    
    await db.query("INSERT INTO presets (id, name, creator_id, price, is_public) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING", 
                   ['pre_neon_88', 'Neon Cyberpunk XL', 'per_123', 500, 1]);
    
    // Seed a persona for the test user
    const testUserId = "7ffe8793-e0e4-4673-9d5a-85fd83c3d4ae";
    await db.query("INSERT INTO personas (id, user_id, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                   ['per_123', testUserId, 'Neon AI']);

    console.log('[Seed] Fixed data seeded successfully.');
  } catch (err) {
    console.error('[Seed] Failed:', err.message);
  } finally {
    process.exit(0);
  }
}

seedFixed();
