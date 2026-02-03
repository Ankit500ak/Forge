import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const res = await pool.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name='tasks' ORDER BY column_name
`);

console.log('Tasks columns:', res.rows.map(r => r.column_name));
pool.end();
