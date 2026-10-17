/*
  Consultas SQL do módulo de Análise de Dados (seção 3.7 do relatório).

  Não há tabelas novas: tudo vem de agrupamentos (GROUP BY, SUM, COUNT) sobre
  produtos, fornecedores e movimentacoes_estoque.

  A função recebe o executor de SQL como parâmetro. Na aplicação ele é o `sql`
  do Neon (lib/db.ts); nos testes é um executor que fala com um PostgreSQL
  comum. Assim as mesmas consultas são testadas contra um banco de verdade.

  Regras de negócio:
  - Só entram produtos ativos (esta_ativo = true) nas listas de produtos.
  - Quantidades de ENTRADA e SAÍDA são somadas em valor absoluto: hoje a rota
    de movimentações grava SAÍDA com quantidade positiva, mas o comentário do
    script do banco diz que ela seria negativa. ABS() funciona nos dois casos.
  - AJUSTES não entram em "entradas" nem "saídas" (são correções de inventário).
  - "Abaixo do mínimo" = quantidade_estoque < estoque_minimo, só para produtos
    com mínimo definido (estoque_minimo > 0).
*/
import { calcularInicioPeriodo, FUSO_HORARIO, type Periodo } from "./periodo";

/** Qualquer função que execute SQL no formato tagged template e devolva as linhas. */
export type ExecutorSql = (
  strings: TemplateStringsArray,
  ...valores: unknown[]
) => Promise<Record<string, unknown>[]>;

export interface ItemEstoque {
  id: string;
  nome: string;
  sku: string;
  quantidade: number;
  estoqueMinimo: number;
}

export interface EntradasSaidasMes {
  /** "AAAA-MM" */
  mes: string;
  entradas: number;
  saidas: number;
}

export interface ProdutoSaidas {
  id: string;
  nome: string;
  quantidade: number;
}

export interface FornecedorEntradas {
  /** null = entradas registradas sem fornecedor */
  id: string | null;
  nome: string;
  quantidade: number;
  movimentacoes: number;
}

export interface ProdutoAbaixoMinimo extends ItemEstoque {
  falta: number;
}

export interface DadosAnalise {
  periodo: Periodo;
  inicio: string;
  fim: string;
  estoqueAtual: ItemEstoque[];
  entradasSaidasPorMes: EntradasSaidasMes[];
  maisSaidas: ProdutoSaidas[];
  entradasPorFornecedor: FornecedorEntradas[];
  abaixoDoMinimo: ProdutoAbaixoMinimo[];
}

export const LIMITE_MAIS_SAIDAS = 10;
export const NOME_SEM_FORNECEDOR = "Sem fornecedor informado";

export async function buscarDadosAnalise(
  sql: ExecutorSql,
  periodo: Periodo,
  agora: Date = new Date(),
): Promise<DadosAnalise> {
  const inicio = calcularInicioPeriodo(periodo, agora);

  const [estoque, porMes, saidas, fornecedores, abaixo] = await Promise.all([
    // 1. Quantidade atual em estoque por produto (não depende do período)
    sql`
      SELECT id, nome, sku, quantidade_estoque, estoque_minimo
      FROM produtos
      WHERE esta_ativo = true
      ORDER BY quantidade_estoque DESC, nome ASC
    `,

    // 2. Entradas e saídas por mês (meses sem movimento aparecem com zero)
    sql`
      SELECT
        to_char(m.mes, 'YYYY-MM') AS mes,
        COALESCE(SUM(ABS(me.quantidade)) FILTER (WHERE me.tipo_movimento = 'ENTRADA'), 0)::int AS entradas,
        COALESCE(SUM(ABS(me.quantidade)) FILTER (WHERE me.tipo_movimento = 'SAIDA'), 0)::int AS saidas
      FROM generate_series(
        date_trunc('month', ${inicio}::timestamptz AT TIME ZONE ${FUSO_HORARIO}),
        date_trunc('month', ${agora}::timestamptz AT TIME ZONE ${FUSO_HORARIO}),
        INTERVAL '1 month'
      ) AS m(mes)
      LEFT JOIN movimentacoes_estoque me
        ON date_trunc('month', me.data_criacao AT TIME ZONE ${FUSO_HORARIO}) = m.mes
       AND me.data_criacao >= ${inicio}::timestamptz
       AND me.data_criacao <= ${agora}::timestamptz
      GROUP BY m.mes
      ORDER BY m.mes
    `,

    // 3. Produtos com maior número de saídas no período
    sql`
      SELECT p.id, p.nome, SUM(ABS(me.quantidade))::int AS quantidade
      FROM movimentacoes_estoque me
      JOIN produtos p ON p.id = me.id_produto
      WHERE me.tipo_movimento = 'SAIDA'
        AND me.data_criacao >= ${inicio}::timestamptz
        AND me.data_criacao <= ${agora}::timestamptz
      GROUP BY p.id, p.nome
      ORDER BY quantidade DESC, p.nome ASC
      LIMIT ${LIMITE_MAIS_SAIDAS}
    `,

    // 4. Quantidade de entradas por fornecedor no período
    sql`
      SELECT
        f.id,
        COALESCE(f.nome, ${NOME_SEM_FORNECEDOR}) AS nome,
        SUM(ABS(me.quantidade))::int AS quantidade,
        COUNT(me.id)::int AS movimentacoes
      FROM movimentacoes_estoque me
      LEFT JOIN fornecedores f ON f.id = me.id_fornecedor
      WHERE me.tipo_movimento = 'ENTRADA'
        AND me.data_criacao >= ${inicio}::timestamptz
        AND me.data_criacao <= ${agora}::timestamptz
      GROUP BY f.id, f.nome
      ORDER BY quantidade DESC, nome ASC
    `,

    // 5. Produtos com estoque abaixo da quantidade mínima (não depende do período)
    sql`
      SELECT id, nome, sku, quantidade_estoque, estoque_minimo,
             (estoque_minimo - quantidade_estoque) AS falta
      FROM produtos
      WHERE esta_ativo = true
        AND estoque_minimo > 0
        AND quantidade_estoque < estoque_minimo
      ORDER BY falta DESC, nome ASC
    `,
  ]);

  const paraItemEstoque = (linha: Record<string, unknown>): ItemEstoque => ({
    id: String(linha.id),
    nome: String(linha.nome),
    sku: String(linha.sku),
    quantidade: Number(linha.quantidade_estoque),
    estoqueMinimo: Number(linha.estoque_minimo),
  });

  return {
    periodo,
    inicio: inicio.toISOString(),
    fim: agora.toISOString(),
    estoqueAtual: estoque.map(paraItemEstoque),
    entradasSaidasPorMes: porMes.map((linha) => ({
      mes: String(linha.mes),
      entradas: Number(linha.entradas),
      saidas: Number(linha.saidas),
    })),
    maisSaidas: saidas.map((linha) => ({
      id: String(linha.id),
      nome: String(linha.nome),
      quantidade: Number(linha.quantidade),
    })),
    entradasPorFornecedor: fornecedores.map((linha) => ({
      id: linha.id == null ? null : String(linha.id),
      nome: String(linha.nome),
      quantidade: Number(linha.quantidade),
      movimentacoes: Number(linha.movimentacoes),
    })),
    abaixoDoMinimo: abaixo.map((linha) => ({
      ...paraItemEstoque(linha),
      falta: Number(linha.falta),
    })),
  };
}
