import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const res = await pool.query(`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema='public' ORDER BY table_name
`);

console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
pool.end();
