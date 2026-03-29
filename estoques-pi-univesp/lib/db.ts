/*
  Definição do conector (pool) da aplicação com o banco de dados PostgreSQL.
  Aqui é utilizado o pacote npm "pg", que permite configurar de forma facilitada essa conexão.
*/
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