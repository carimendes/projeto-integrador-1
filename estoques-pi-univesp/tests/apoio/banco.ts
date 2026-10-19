import { readFileSync } from "node:fs";
import path from "node:path";
import { Client, Pool } from "pg";
import type { ExecutorSql } from "@/lib/analise/consultas";

/*
  Banco de testes: cria um schema temporário num PostgreSQL de verdade,
  roda os scripts do projeto (construcao-bd.sql + migração 002) e no final
  apaga tudo. Nada é gravado nas tabelas reais.

  Precisa da variável TEST_DATABASE_URL, por exemplo:
    TEST_DATABASE_URL=postgresql://postgres@localhost:5432/estoques_teste
  (pode ser um branch de testes no Neon também).
*/

export const URL_BANCO_TESTE = process.env.TEST_DATABASE_URL;

const PASTA_SCRIPTS = path.resolve(import.meta.dirname, "../../../scripts-bd");

export interface BancoTeste {
  cliente: Pool;
  /** Executor no mesmo formato do `sql` do Neon, usado pela aplicação. */
  sql: ExecutorSql;
  encerrar: () => Promise<void>;
}

/** Transforma `sql\`... ${valor} ...\`` em consulta parametrizada do pacote "pg". */
export function criarExecutor(cliente: Pool): ExecutorSql {
  return async (partes, ...valores) => {
    const texto = partes.reduce((acc, parte, i) => `${acc}$${i}${parte}`);
    const resultado = await cliente.query(texto, valores);
    return resultado.rows;
  };
}

export async function criarBancoTeste(): Promise<BancoTeste> {
  const schema = `teste_${process.pid}_${Date.now()}`;

  const admin = new Client({ connectionString: URL_BANCO_TESTE });
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${schema}`);
  await admin.end();

  // Várias conexões (as consultas da análise rodam em paralelo), todas
  // apontando para o schema temporário.
  const pool = new Pool({
    connectionString: URL_BANCO_TESTE,
    options: `-c search_path=${schema},public`,
    max: 5,
  });

  for (const script of ["construcao-bd.sql", "002-analise-acessibilidade.sql"]) {
    await pool.query(readFileSync(path.join(PASTA_SCRIPTS, script), "utf8"));
  }

  return {
    cliente: pool,
    sql: criarExecutor(pool),
    encerrar: async () => {
      await pool.query(`DROP SCHEMA ${schema} CASCADE`);
      await pool.end();
    },
  };
}
