import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";
import { validarMovimentacao } from "@/lib/validacoes";
import {
  MENSAGENS,
  codigoErroBanco,
  erroServidor,
  erroValidacao,
  naoAutenticado,
} from "@/lib/respostas-api";

/*
  GET - Listar movimentações
*/
export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const movimentacoes = await sql`
      SELECT 
        me.*, 
        p.nome as nome_produto, 
        f.nome as nome_fornecedor, 
        u.nome as nome_usuario 
      FROM movimentacoes_estoque me 
      LEFT JOIN produtos p ON me.id_produto = p.id 
      LEFT JOIN fornecedores f ON me.id_fornecedor = f.id 
      LEFT JOIN usuarios u ON me.id_usuario = u.id
      ORDER BY me.data_criacao DESC
    `;

    return NextResponse.json(movimentacoes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}

/*
  POST - Registrar movimentação + atualizar estoque
  Validação com mensagens em linguagem simples (seção 3.8 — Acessibilidade).
*/
export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return naoAutenticado();
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return erroValidacao(MENSAGENS.corpoInvalido);
  }

  const validacao = validarMovimentacao(body);
  if (!validacao.ok) {
    return erroValidacao(validacao.mensagem, validacao.campo);
  }
  const dados = validacao.dados;

  // ENTRADA soma, SAÍDA subtrai, AJUSTE soma o valor com sinal (negativo diminui).
  const variacao = dados.tipo_movimento === "SAIDA" ? -dados.quantidade : dados.quantidade;

  try {
    // =========================
    // ATUALIZAÇÃO ATÔMICA
    // (a condição impede que o estoque fique negativo)
    // =========================
    const updateResult = await sql`
      UPDATE produtos
      SET quantidade_estoque = quantidade_estoque + ${variacao}
      WHERE id = ${dados.id_produto}
      AND quantidade_estoque + ${variacao} >= 0
      RETURNING quantidade_estoque
    `;

    if (updateResult.length === 0) {
      const [produto] = await sql`
        SELECT quantidade_estoque FROM produtos WHERE id = ${dados.id_produto}
      `;
      if (!produto) {
        return erroValidacao("Produto não encontrado. Recarregue a página e selecione de novo.", "id_produto");
      }
      return erroValidacao(
        `Estoque insuficiente: há apenas ${produto.quantidade_estoque} unidade(s) deste produto.`,
        "quantidade",
      );
    }

    // =========================
    // REGISTRA MOVIMENTAÇÃO
    // =========================
    const [movimentacao] = await sql`
      INSERT INTO movimentacoes_estoque (
        tipo_movimento,
        id_produto,
        quantidade,
        motivacao,
        id_fornecedor,
        referencia_externa,
        id_usuario
      )
      VALUES (
        ${dados.tipo_movimento},
        ${dados.id_produto},
        ${dados.quantidade},
        ${dados.motivacao},
        ${dados.id_fornecedor},
        ${dados.referencia_externa},
        ${session.user.id}
      )
      RETURNING *
    `;

    return NextResponse.json(movimentacao);
  } catch (error) {
    console.error(error);
    if (codigoErroBanco(error) === "22P02") {
      // identificador em formato inválido
      return erroValidacao("Produto ou fornecedor inválido. Recarregue a página e tente de novo.");
    }
    return erroServidor("Não foi possível registrar a movimentação. Tente novamente em alguns instantes.");
  }
}
