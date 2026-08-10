// src/core/database/sqlite-client.ts
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'nutriai.db';
const SCHEMA_VERSION = 1;

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_meta WHERE id = 1;',
  );
  const currentVersion = row?.version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS food_logs (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        brand TEXT,
        calories REAL NOT NULL,
        protein_g REAL NOT NULL,
        carbs_g REAL NOT NULL,
        fat_g REAL NOT NULL,
        serving_size TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        logged_at TEXT NOT NULL,
        image_uri TEXT,
        source TEXT NOT NULL DEFAULT 'manual',
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_food_logs_logged_at ON food_logs (logged_at);
      CREATE INDEX IF NOT EXISTS idx_food_logs_sync_status ON food_logs (sync_status);

      CREATE TABLE IF NOT EXISTS step_logs (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL UNIQUE,
        steps INTEGER NOT NULL,
        distance_meters REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);
  }

  await db.runAsync(
    `INSERT INTO schema_meta (id, version) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET version = excluded.version;`,
    [SCHEMA_VERSION],
  );
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  if (!initPromise) {
    initPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await runMigrations(db);
      dbInstance = db;
      return db;
    })();
  }

  return initPromise;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    initPromise = null;
  }
}