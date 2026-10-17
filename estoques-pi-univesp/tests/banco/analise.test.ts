import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buscarDadosAnalise, NOME_SEM_FORNECEDOR, type DadosAnalise } from "@/lib/analise/consultas";
import { calcularInicioPeriodo } from "@/lib/analise/periodo";
import { criarBancoTeste, URL_BANCO_TESTE, type BancoTeste } from "../apoio/banco";

/*
  Validação do módulo de Análise de Dados contra um PostgreSQL de verdade
  (seção 3.7 do relatório: "comparação entre os valores apresentados nos
  gráficos e os resultados obtidos diretamente por consultas SQL").

  Os dados de teste abaixo foram escolhidos para cobrir os casos que mais
  dão erro: virada de mês no fuso de São Paulo, ajustes (que não contam),
  produto inativo, produto exatamente no mínimo e saída gravada com sinal
  negativo.
*/

// "Agora" fixo: 17/10/2026, 12:00 em São Paulo
const AGORA = new Date("2026-10-17T12:00:00-03:00");

let banco: BancoTeste;
const ids: Record<string, string> = {};

async function inserirProduto(sku: string, qtd: number, minimo: number, ativo = true) {
  const [linha] = await banco.sql`
    INSERT INTO produtos (sku, nome, tipo_bobina, largura, gramatura, quantidade_estoque, estoque_minimo, esta_ativo)
    VALUES (${sku}, ${"Bobina " + sku}, 'SIMPLES', 40, 60, ${qtd}, ${minimo}, ${ativo})
    RETURNING id
  `;
  ids[sku] = String(linha.id);
}

async function mov(tipo: string, sku: string, qtd: number, quando: string, fornecedor?: string) {
  await banco.sql`
    INSERT INTO movimentacoes_estoque (tipo_movimento, id_produto, quantidade, id_fornecedor, data_criacao)
    VALUES (${tipo}, ${ids[sku]}, ${qtd}, ${fornecedor ? ids[fornecedor] : null}, ${quando}::timestamptz)
  `;
}

describe.skipIf(!URL_BANCO_TESTE)("Análise de Dados — consultas no banco", () => {
  beforeAll(async () => {
    banco = await criarBancoTeste();

    for (const [cnpj, nome] of [["11111111000111", "Papelaria Norte"], ["22222222000122", "Rolos Sul"]]) {
      const [f] = await banco.sql`INSERT INTO fornecedores (cnpj, nome) VALUES (${cnpj}, ${nome}) RETURNING id`;
      ids[nome] = String(f.id);
    }

    await inserirProduto("A", 5, 10); // abaixo do mínimo (faltam 5)
    await inserirProduto("B", 50, 20); // acima do mínimo
    await inserirProduto("C", 0, 0); // sem mínimo definido
    await inserirProduto("E", 20, 20); // exatamente no mínimo → NÃO está abaixo
    await inserirProduto("D", 2, 5, false); // inativo → fica de fora de tudo

    // setembro/2026
    await mov("ENTRADA", "B", 100, "2026-09-05T10:00:00-03:00", "Rolos Sul");
    await mov("SAIDA", "B", 70, "2026-09-20T10:00:00-03:00");
    // 30/09 às 22h em São Paulo = 01/10 em UTC → tem que contar em SETEMBRO
    await mov("ENTRADA", "A", 7, "2026-09-30T22:00:00-03:00", "Papelaria Norte");
    // outubro/2026
    await mov("ENTRADA", "B", 20, "2026-10-01T02:00:00-03:00"); // sem fornecedor
    await mov("AJUSTE", "A", -3, "2026-10-05T10:00:00-03:00"); // ajuste não conta
    await mov("ENTRADA", "A", 30, "2026-10-10T10:00:00-03:00", "Papelaria Norte");
    await mov("SAIDA", "A", 25, "2026-10-12T10:00:00-03:00");
    await mov("SAIDA", "B", 10, "2026-10-15T10:00:00-03:00");
    await mov("SAIDA", "B", -5, "2026-10-16T10:00:00-03:00"); // saída gravada com sinal negativo
    // fora dos últimos 6 meses, mas dentro do último ano
    await mov("SAIDA", "C", 4, "2025-12-10T10:00:00-03:00");
    await mov("ENTRADA", "C", 999, "2026-03-15T10:00:00-03:00", "Rolos Sul");
    // depois de "agora" → não pode entrar em nenhum período
    await mov("ENTRADA", "B", 500, "2026-10-17T18:00:00-03:00", "Rolos Sul");
  });

  afterAll(async () => {
    await banco?.encerrar();
  });

  describe("período: últimos 6 meses", () => {
    let dados: DadosAnalise;
    beforeAll(async () => {
      dados = await buscarDadosAnalise(banco.sql, "6m", AGORA);
    });

    it("entradas e saídas por mês: 6 meses, meses vazios com zero, virada de mês no fuso de SP", () => {
      expect(dados.entradasSaidasPorMes).toEqual([
        { mes: "2026-05", entradas: 0, saidas: 0 },
        { mes: "2026-06", entradas: 0, saidas: 0 },
        { mes: "2026-07", entradas: 0, saidas: 0 },
        { mes: "2026-08", entradas: 0, saidas: 0 },
        { mes: "2026-09", entradas: 107, saidas: 70 },
        { mes: "2026-10", entradas: 50, saidas: 40 },
      ]);
    });

    it("produtos com mais saídas (soma em valor absoluto, sem ajustes)", () => {
      expect(dados.maisSaidas).toEqual([
        { id: ids.B, nome: "Bobina B", quantidade: 85 },
        { id: ids.A, nome: "Bobina A", quantidade: 25 },
      ]);
    });

    it("entradas por fornecedor, incluindo entradas sem fornecedor", () => {
      expect(dados.entradasPorFornecedor).toEqual([
        { id: ids["Rolos Sul"], nome: "Rolos Sul", quantidade: 100, movimentacoes: 1 },
        { id: ids["Papelaria Norte"], nome: "Papelaria Norte", quantidade: 37, movimentacoes: 2 },
        { id: null, nome: NOME_SEM_FORNECEDOR, quantidade: 20, movimentacoes: 1 },
      ]);
    });

    it("estoque atual: só produtos ativos, do maior para o menor", () => {
      expect(dados.estoqueAtual.map((p) => [p.sku, p.quantidade, p.estoqueMinimo])).toEqual([
        ["B", 50, 20],
        ["E", 20, 20],
        ["A", 5, 10],
        ["C", 0, 0],
      ]);
    });

    it("abaixo do mínimo: só A (E está no mínimo, C não tem mínimo, D está inativo)", () => {
      expect(dados.abaixoDoMinimo).toEqual([
        { id: ids.A, nome: "Bobina A", sku: "A", quantidade: 5, estoqueMinimo: 10, falta: 5 },
      ]);
    });
  });

  describe("período: últimos 30 dias", () => {
    it("só considera movimentos a partir de 17/09", async () => {
      const dados = await buscarDadosAnalise(banco.sql, "30d", AGORA);
      expect(dados.entradasSaidasPorMes).toEqual([
        { mes: "2026-09", entradas: 7, saidas: 70 },
        { mes: "2026-10", entradas: 50, saidas: 40 },
      ]);
      expect(dados.entradasPorFornecedor.map((f) => [f.nome, f.quantidade])).toEqual([
        ["Papelaria Norte", 37],
        [NOME_SEM_FORNECEDOR, 20],
      ]);
    });
  });

  describe("período: último ano", () => {
    it("inclui os 12 meses e os movimentos antigos", async () => {
      const dados = await buscarDadosAnalise(banco.sql, "1a", AGORA);
      expect(dados.entradasSaidasPorMes).toHaveLength(12);
      expect(dados.entradasSaidasPorMes[0].mes).toBe("2025-11");
      expect(dados.entradasSaidasPorMes.find((m) => m.mes === "2025-12")).toEqual({
        mes: "2025-12",
        entradas: 0,
        saidas: 4,
      });
      expect(dados.entradasSaidasPorMes.find((m) => m.mes === "2026-03")?.entradas).toBe(999);
      expect(dados.maisSaidas.map((p) => [p.nome, p.quantidade])).toEqual([
        ["Bobina B", 85],
        ["Bobina A", 25],
        ["Bobina C", 4],
      ]);
    });
  });

  describe("conferência com SQL direto (método do relatório)", () => {
    it.each(["30d", "6m", "1a"] as const)(
      "%s: total de entradas e saídas dos gráficos = soma direta na tabela",
      async (periodo) => {
        const dados = await buscarDadosAnalise(banco.sql, periodo, AGORA);
        const inicio = calcularInicioPeriodo(periodo, AGORA);

        const [direto] = await banco.sql`
          SELECT
            COALESCE(SUM(ABS(quantidade)) FILTER (WHERE tipo_movimento = 'ENTRADA'), 0)::int AS entradas,
            COALESCE(SUM(ABS(quantidade)) FILTER (WHERE tipo_movimento = 'SAIDA'), 0)::int AS saidas
          FROM movimentacoes_estoque
          WHERE data_criacao >= ${inicio} AND data_criacao <= ${AGORA}
        `;

        const soma = (campo: "entradas" | "saidas") =>
          dados.entradasSaidasPorMes.reduce((total, m) => total + m[campo], 0);

        expect(soma("entradas")).toBe(direto.entradas);
        expect(soma("saidas")).toBe(direto.saidas);
        expect(dados.entradasPorFornecedor.reduce((t, f) => t + f.quantidade, 0)).toBe(direto.entradas);
      },
    );
  });

  describe("migração 002", () => {
    it("não aceita estoque mínimo negativo", async () => {
      await expect(
        banco.sql`UPDATE produtos SET estoque_minimo = -1 WHERE sku = 'A'`,
      ).rejects.toThrow(/produtos_estoque_minimo_check/);
    });

    it("cria as preferências de acessibilidade com valores padrão", async () => {
      const [u] = await banco.sql`
        INSERT INTO usuarios (email, senha, nome) VALUES ('teste@exemplo.com', 'x', 'Teste')
        RETURNING tamanho_fonte, alto_contraste
      `;
      expect(u).toEqual({ tamanho_fonte: "normal", alto_contraste: false });
      await expect(
        banco.sql`UPDATE usuarios SET tamanho_fonte = 'gigante' WHERE email = 'teste@exemplo.com'`,
      ).rejects.toThrow(/usuarios_tamanho_fonte_check/);
    });

    it("pode ser rodada de novo sem erro", async () => {
      const { readFileSync } = await import("node:fs");
      const path = await import("node:path");
      const script = readFileSync(
        path.resolve(import.meta.dirname, "../../../scripts-bd/002-analise-acessibilidade.sql"),
        "utf8",
      );
      await expect(banco.cliente.query(script)).resolves.toBeDefined();
    });
  });
});
