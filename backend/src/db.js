// Database abstraction layer supporting PostgreSQL and SQLite fallback
const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

let client = null;
let sqliteDb = null;
const PG_URL = process.env.PG_URL;

async function initDb() {
  if (PG_URL) {
    console.log('[DB] Initializing PostgreSQL connection...');
    const pool = new Pool({ connectionString: PG_URL });
    // Test connection
    try {
      await pool.query('SELECT 1');
      console.log('[DB] PostgreSQL connected successfully');
      client = pool;
    } catch (err) {
      console.error('[DB] PostgreSQL connection failed:', err.message);
      console.log('[DB] Falling back to SQLite');
      initSqlite();
    }
  } else {
    console.log('[DB] PG_URL not set, using SQLite fallback');
    initSqlite();
  }
}

function initSqlite() {
  const dbPath = path.join(__dirname, '../../dev.sqlite');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('foreign_keys = ON');
  console.log(`[DB] SQLite initialized at ${dbPath}`);
}

async function query(sql, params = []) {
  if (client) {
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } catch (err) {
      console.error('[DB] Query error:', err.message);
      throw err;
    }
  } else if (sqliteDb) {
    try {
      // Convert parameterized PostgreSQL syntax ($1, $2) to SQLite (?)
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      const stmt = sqliteDb.prepare(sqliteSql);
      if (sql.trim().startsWith('SELECT')) {
        return stmt.all(...params);
      } else {
        stmt.run(...params);
        return { changes: sqliteDb.prepare('SELECT changes() as changes').get().changes };
      }
    } catch (err) {
      console.error('[DB] SQLite query error:', err.message);
      throw err;
    }
  } else {
    throw new Error('Database not initialized');
  }
}

async function close() {
  if (client) {
    await client.end();
  } else if (sqliteDb) {
    sqliteDb.close();
  }
}

module.exports = {
  initDb,
  query,
  close,
  getClient: () => client,
  getSqliteDb: () => sqliteDb,
};
