import pool from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const client = await pool.connect();

    const produtosCadastrados = (
      await client.query("SELECT COUNT (p.id) FROM produtos p")
    ).rows[0].count;
    const totalEstoque = (
      await client.query("SELECT SUM (p.quantidade_estoque) FROM produtos p")
    ).rows[0].sum;
    const movimentacoesEntrada = (
      await client.query(
        "SELECT COUNT (me.id) FROM movimentacoes_estoque me WHERE me.tipo_movimento = 'ENTRADA'",
      )
    ).rows[0].count;
    const movimentacoesSaida = (
      await client.query(
        "SELECT COUNT (me.id) FROM movimentacoes_estoque me WHERE me.tipo_movimento = 'SAIDA'",
      )
    ).rows[0].count;
    const ultimasMovimentacoes = (
      await client.query(
        "SELECT me.*, p.nome as nome_produto, f.nome as nome_fornecedor, u.nome as nome_usuario FROM movimentacoes_estoque me LEFT JOIN produtos p ON me.id_produto = p.id LEFT JOIN fornecedores f ON me.id_fornecedor = f.id LEFT JOIN usuarios u ON me.id_usuario = u.id ORDER BY me.data_criacao DESC LIMIT 5",
      )
    ).rows;
    return NextResponse.json({
      produtosCadastrados,
      totalEstoque,
      movimentacoesEntrada,
      movimentacoesSaida,
      ultimasMovimentacoes,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}
