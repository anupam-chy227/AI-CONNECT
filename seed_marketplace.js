const db = require('./backend/src/db');

async function seedMarketplace() {
  console.log('[Seed] Seeding marketplace data...');
  try {
    // Drop and recreate presets if needed, but here we just insert
    await db.query('CREATE TABLE IF NOT EXISTS presets (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), creator_id VARCHAR(255), price INT, is_public BOOLEAN)');
    await db.query('CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, user_id VARCHAR(255), item_id VARCHAR(255), item_type VARCHAR(255), amount INT, status VARCHAR(255))');
    
    await db.query("INSERT INTO presets (id, name, creator_id, price, is_public) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING", 
                   ['pre_neon_88', 'Neon Cyberpunk XL', 'per_123', 500, 1]);
    
    console.log('[Seed] Marketplace seeded successfully.');
  } catch (err) {
    console.error('[Seed] Failed to seed marketplace:', err.message);
  } finally {
    process.exit(0);
  }
}

seedMarketplace();
