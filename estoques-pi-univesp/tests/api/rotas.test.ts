import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/*
  Testes das rotas de API dos módulos de Análise e Acessibilidade, sem banco:
  a sessão e o banco são simulados.

  Verificam o que o relatório pede para a rota (seção 3.7): só usuários
  autenticados acessam, o filtro de período é validado e as mensagens de
  erro são em linguagem simples (seção 3.8).
*/

const sessao = vi.hoisted(() => ({ atual: null as null | { user: { id: string } } }));
const banco = vi.hoisted(() => ({ sql: vi.fn() }));
const consultas = vi.hoisted(() => ({ buscarDadosAnalise: vi.fn() }));

vi.mock("@/lib/server-session", () => ({ getAuthSession: async () => sessao.atual }));
vi.mock("@/lib/db", () => ({ sql: banco.sql }));
vi.mock("@/lib/analise/consultas", () => consultas);

const { GET: getAnalise } = await import("@/app/api/analise/route");
const { GET: getPreferencias, PUT: putPreferencias } = await import("@/app/api/preferencias/route");
const { POST: postMovimentacao } = await import("@/app/api/movimentacoes-estoque/route");

const USUARIO = { user: { id: "11111111-1111-4111-8111-111111111111" } };

const requisicao = (url: string, init?: { method?: string; body?: unknown }) =>
  new NextRequest(new URL(url, "http://localhost"), {
    method: init?.method ?? "GET",
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  sessao.atual = null;
  banco.sql.mockReset();
  consultas.buscarDadosAnalise.mockReset();
});

describe("GET /api/analise", () => {
  it("bloqueia quem não está logado (401) sem consultar o banco", async () => {
    const r = await getAnalise(requisicao("/api/analise?periodo=6m"));
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: "Sua sessão expirou. Entre novamente para continuar." });
    expect(consultas.buscarDadosAnalise).not.toHaveBeenCalled();
  });

  it("rejeita período inválido com mensagem simples", async () => {
    sessao.atual = USUARIO;
    const r = await getAnalise(requisicao("/api/analise?periodo=2anos"));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({
      error: "Período inválido. Escolha últimos 30 dias, últimos 6 meses ou último ano.",
      campo: "periodo",
    });
  });

  it.each(["30d", "6m", "1a"])("aceita o período %s e devolve os dados", async (periodo) => {
    sessao.atual = USUARIO;
    consultas.buscarDadosAnalise.mockResolvedValue({ periodo });
    const r = await getAnalise(requisicao(`/api/analise?periodo=${periodo}`));
    expect(r.status).toBe(200);
    expect(consultas.buscarDadosAnalise).toHaveBeenCalledWith(banco.sql, periodo);
  });

  it("sem período, usa os últimos 6 meses", async () => {
    sessao.atual = USUARIO;
    consultas.buscarDadosAnalise.mockResolvedValue({});
    await getAnalise(requisicao("/api/analise"));
    expect(consultas.buscarDadosAnalise).toHaveBeenCalledWith(banco.sql, "6m");
  });

  it("erro do banco vira mensagem simples, sem detalhes técnicos", async () => {
    sessao.atual = USUARIO;
    vi.spyOn(console, "error").mockImplementation(() => {});
    consultas.buscarDadosAnalise.mockRejectedValue(new Error('relation "produtos" does not exist'));
    const r = await getAnalise(requisicao("/api/analise"));
    expect(r.status).toBe(500);
    const corpo = await r.json();
    expect(corpo.error).toBe(
      "Não foi possível carregar os dados de análise. Tente novamente em alguns instantes.",
    );
    expect(JSON.stringify(corpo)).not.toContain("relation");
  });
});

describe("/api/preferencias", () => {
  it("GET e PUT exigem login", async () => {
    expect((await getPreferencias()).status).toBe(401);
    const r = await putPreferencias(
      requisicao("/api/preferencias", { method: "PUT", body: { tamanhoFonte: "grande", altoContraste: true } }),
    );
    expect(r.status).toBe(401);
    expect(banco.sql).not.toHaveBeenCalled();
  });

  it("GET devolve as preferências salvas do usuário", async () => {
    sessao.atual = USUARIO;
    banco.sql.mockResolvedValue([{ tamanho_fonte: "muito_grande", alto_contraste: true }]);
    const r = await getPreferencias();
    expect(await r.json()).toEqual({ tamanhoFonte: "muito_grande", altoContraste: true });
  });

  it("PUT salva no banco para o usuário logado", async () => {
    sessao.atual = USUARIO;
    banco.sql.mockResolvedValue([]);
    const r = await putPreferencias(
      requisicao("/api/preferencias", { method: "PUT", body: { tamanhoFonte: "grande", altoContraste: true } }),
    );
    expect(r.status).toBe(200);
    const [, ...valores] = banco.sql.mock.calls[0];
    expect(valores).toEqual(["grande", true, USUARIO.user.id]);
  });

  it("PUT com valor inválido não salva e explica o erro", async () => {
    sessao.atual = USUARIO;
    const r = await putPreferencias(
      requisicao("/api/preferencias", { method: "PUT", body: { tamanhoFonte: "gigante", altoContraste: true } }),
    );
    expect(r.status).toBe(400);
    expect((await r.json()).campo).toBe("tamanhoFonte");
    expect(banco.sql).not.toHaveBeenCalled();
  });
});

describe("POST /api/movimentacoes-estoque — mensagens de erro", () => {
  const corpo = {
    id_produto: "0b6f1c1e-0000-4000-8000-000000000001",
    tipo_movimento: "SAIDA",
    quantidade: "0",
  };

  it("quantidade zero devolve a mensagem do relatório, ligada ao campo", async () => {
    sessao.atual = USUARIO;
    const r = await postMovimentacao(requisicao("/api/movimentacoes-estoque", { method: "POST", body: corpo }));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "A quantidade deve ser maior que zero.", campo: "quantidade" });
    expect(banco.sql).not.toHaveBeenCalled();
  });

  it("saída maior que o estoque explica quanto há disponível", async () => {
    sessao.atual = USUARIO;
    banco.sql
      .mockResolvedValueOnce([]) // UPDATE não altera nenhuma linha
      .mockResolvedValueOnce([{ quantidade_estoque: 3 }]); // estoque atual
    const r = await postMovimentacao(
      requisicao("/api/movimentacoes-estoque", { method: "POST", body: { ...corpo, quantidade: "5" } }),
    );
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({
      error: "Estoque insuficiente: há apenas 3 unidade(s) deste produto.",
      campo: "quantidade",
    });
  });
});
