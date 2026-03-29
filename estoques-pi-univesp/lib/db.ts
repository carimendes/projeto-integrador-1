// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  user: 'estoques',
  password: 'univesp123!',
  host: '127.0.0.1',
  port: 5432,
  database: 'estoques_db',
  ssl: false,
});

export default pool;