import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

/*
  Função que define a rota da API que irá responder a chamadas para registrar e realizar movimentações.
  O verbo utilizado é o POST, e a rota será {urlHospedagem}/api/movimentacoes-estoque
  Os dados do movimentação são passados para a API no body da request.
  Aqui é manipulado tanto a tabela de movimentações quanto a tabela de produtos, atualizando a quantidade disponível em estoque.
*/
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tipo_movimento,
      id_produto,
      quantidade,
      motivacao,
      id_fornecedor,
      referencia_externa,
    } = body;

    if (!["ENTRADA", "SAIDA", "AJUSTE"].includes(tipo_movimento))
      return NextResponse.json(
        { error: "Erro: operação inexistente" },
        { status: 500 },
      );

    const client = await pool.connect();

    const produtoSelecionado = (
      await client.query(
        "SELECT id, quantidade_estoque FROM produtos WHERE id = $1",
        [id_produto],
      )
    ).rows[0];

    const registroMovimento = (
      await client.query(
        "INSERT INTO movimentacoes_estoque(tipo_movimento, id_produto, quantidade, motivacao, id_fornecedor, referencia_externa, id_usuario) VALUES($1, $2, $3, $4, $5, $6, '2faf6ea6-0a32-44c1-9c18-dcfb00f588c4') RETURNING *",
        [
          tipo_movimento,
          id_produto,
          quantidade,
          motivacao,
          id_fornecedor,
          referencia_externa,
        ],
      )
    ).rows[0];

    if (tipo_movimento === "ENTRADA") {
      await client.query(
        "UPDATE produtos SET quantidade_estoque = $1 WHERE id = $2",
        [
          parseInt(produtoSelecionado.quantidade_estoque) +
            parseInt(quantidade),
          id_produto,
        ],
      );
    } else if (tipo_movimento === "SAIDA") {
      await client.query(
        "UPDATE produtos SET quantidade_estoque = $1 WHERE id = $2",
        [
          parseInt(produtoSelecionado.quantidade_estoque) -
            parseInt(quantidade),
          id_produto,
        ],
      );
    } else if (tipo_movimento === "AJUSTE") {
      await client.query(
        "UPDATE produtos SET quantidade_estoque = $1 WHERE id = $2",
        [
          parseInt(produtoSelecionado.quantidade_estoque) +
            parseInt(quantidade),
          id_produto,
        ],
      );
    }

    client.release();
    return NextResponse.json(registroMovimento);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}
