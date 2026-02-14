/**
 * Database Migration Runner
 * Automatically runs pending migrations on startup
 * 
 * Usage:
 *   import { runMigrations } from './migrations.js'
 *   await runMigrations();
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'config', 'migrations');

export async function runMigrations(useExistingPool = null) {
    try {
        // Get database connection from environment
        const postgresUrl = process.env.POSTGRES_URL;

        if (!postgresUrl) {
            console.log('⚠️  [Migrations] POSTGRES_URL not found, skipping migrations');
            return;
        }

        // Use existing pool if provided, otherwise create new one
        let pool = useExistingPool;
        let shouldClosPool = false;

        if (!pool) {
            pool = new Pool({
                connectionString: postgresUrl,
                ssl: { rejectUnauthorized: false } // Needed for Supabase
            });
            shouldClosPool = true;
        }

        // Get all .sql files from migrations directory
        const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();

        if (migrationFiles.length === 0) {
            console.log('✅ [Migrations] No migrations to run');
            if (shouldClosPool) {
                await pool.end();
            }
            return;
        }

        console.log(`🔄 [Migrations] Running ${migrationFiles.length} migration(s)...`);

        for (const file of migrationFiles) {
            try {
                const filePath = path.join(MIGRATIONS_DIR, file);
                const sql = fs.readFileSync(filePath, 'utf-8');

                console.log(`   📝 Running: ${file}`);

                // Execute migration
                await pool.query(sql);
                console.log(`   ✅ ${file} completed`);
            } catch (err) {
                console.error(`   ❌ Error running migration ${file}:`, err.message);
            }
        }

        console.log('✅ [Migrations] All migrations complete!');

        if (shouldClosPool) {
            await pool.end();
        }
    } catch (err) {
        console.error('❌ [Migrations] Fatal error:', err.message);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations().catch(console.error);
}
