import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";

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
*/
export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const {
      tipo_movimento,
      id_produto,
      quantidade,
      motivacao,
      id_fornecedor = null,
      referencia_externa,
    } = body;

    if (!["ENTRADA", "SAIDA", "AJUSTE"].includes(tipo_movimento)) {
      return NextResponse.json(
        { error: "Operação inválida" },
        { status: 400 }
      );
    }

    const qtd = Number(quantidade);

    if (!qtd || qtd === 0) {
      return NextResponse.json(
        { error: "Quantidade inválida" },
        { status: 400 }
      );
    }

    // =========================
    // ATUALIZAÇÃO ATÔMICA
    // =========================

    let updateResult;

    if (tipo_movimento === "ENTRADA" || tipo_movimento === "AJUSTE") {
      // soma direto (seguro)
      updateResult = await sql`
        UPDATE produtos
        SET quantidade_estoque = quantidade_estoque + ${qtd}
        WHERE id = ${id_produto}
        RETURNING *
      `;
    } else {
      // SAÍDA com proteção contra estoque negativo
      updateResult = await sql`
        UPDATE produtos
        SET quantidade_estoque = quantidade_estoque - ${qtd}
        WHERE id = ${id_produto}
        AND quantidade_estoque >= ${qtd}
        RETURNING *
      `;

      if (updateResult.length === 0) {
        return NextResponse.json(
          { error: "Estoque insuficiente ou produto inexistente" },
          { status: 400 }
        );
      }
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
        ${tipo_movimento},
        ${id_produto},
        ${qtd},
        ${motivacao ?? null},
        ${id_fornecedor},
        ${referencia_externa ?? null},
        ${session.user.id}
      )
      RETURNING *
    `;

    return NextResponse.json(movimentacao);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Erro de banco de dados" },
      { status: 500 }
    );
  }
}