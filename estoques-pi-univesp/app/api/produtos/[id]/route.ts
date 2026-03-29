import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idProduto } = await context.params;
  try {
    const body = await request.json();
    const { sku, nome, tipo_bobina, largura, gramatura, url_foto } = body;

    const client = await pool.connect();

    const produto = (
      await client.query(
        `SELECT * FROM fornecedores WHERE id = '${idProduto}'`,
      )
    ).rows[0];

    const fornecedorAtualizado = (
      await client.query(
        `UPDATE fornecedores SET sku = $1, nome = $2, tipo_bobina = $3, largura = $4, gramatura = $5, url_foto = $6, data_atualizacao = NOW() WHERE id = '${idProduto}' RETURNING *`,
        [
          sku || produto.sku,
          nome || produto.nome,
          tipo_bobina || produto.tipo_bobina,
          largura || produto.largura,
          gramatura || produto.gramatura,
          url_foto || produto.url_foto,
        ],
      )
    ).rows[0];

    client.release();

    return NextResponse.json(fornecedorAtualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idProduto } = await context.params;
  try {
    const client = await pool.connect();

    const produtoRemovido = (
      await client.query(
        `DELETE FROM fornecedores WHERE id = '${idProduto}' RETURNING *`,
      )
    ).rows[0];

    client.release();

    return NextResponse.json(produtoRemovido);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}
