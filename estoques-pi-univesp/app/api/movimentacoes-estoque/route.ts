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

    // 🔥 TRANSAÇÃO (ESSENCIAL)
    const resultado = await sql.transaction(async (tx) => {
      // 1. Buscar produto atual
      const [produto] = await tx`
        SELECT id, quantidade_estoque
        FROM produtos
        WHERE id = ${id_produto}
      `;

      if (!produto) {
        throw new Error("Produto não encontrado");
      }

      const estoqueAtual = Number(produto.quantidade_estoque);
      const qtd = Number(quantidade);

      let novoEstoque = estoqueAtual;

      if (tipo_movimento === "ENTRADA") {
        novoEstoque = estoqueAtual + qtd;
      } else if (tipo_movimento === "SAIDA") {
        if (estoqueAtual < qtd) {
          throw new Error("Estoque insuficiente");
        }
        novoEstoque = estoqueAtual - qtd;
      } else if (tipo_movimento === "AJUSTE") {
        novoEstoque = estoqueAtual + qtd;
      }

      // 2. Atualizar estoque
      await tx`
        UPDATE produtos
        SET quantidade_estoque = ${novoEstoque}
        WHERE id = ${id_produto}
      `;

      // 3. Registrar movimentação
      const [movimentacao] = await tx`
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
          ${session?.user?.id}
        )
        RETURNING *
      `;

      return movimentacao;
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Erro de banco de dados" },
      { status: 500 }
    );
  }
}