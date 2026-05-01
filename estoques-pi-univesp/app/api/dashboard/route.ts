import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const [{ count: produtosCadastrados }] =
      await sql`SELECT COUNT(p.id) FROM produtos p`;

    const [{ sum: totalEstoque }] =
      await sql`SELECT SUM(p.quantidade_estoque) FROM produtos p`;

    const [{ count: movimentacoesEntrada }] =
      await sql`
        SELECT COUNT(me.id)
        FROM movimentacoes_estoque me
        WHERE me.tipo_movimento = 'ENTRADA'
      `;

    const [{ count: movimentacoesSaida }] =
      await sql`
        SELECT COUNT(me.id)
        FROM movimentacoes_estoque me
        WHERE me.tipo_movimento = 'SAIDA'
      `;

    const ultimasMovimentacoes = await sql`
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
      LIMIT 5
    `;

    return NextResponse.json({
      produtosCadastrados: Number(produtosCadastrados),
      totalEstoque: Number(totalEstoque ?? 0),
      movimentacoesEntrada: Number(movimentacoesEntrada),
      movimentacoesSaida: Number(movimentacoesSaida),
      ultimasMovimentacoes,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}