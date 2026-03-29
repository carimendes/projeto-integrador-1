import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idFornecedor } = await context.params;
  try {
    const body = await request.json();
    const { nome, contato, email, telefone, notas } = body;

    const client = await pool.connect();

    const fornecedor = (
      await client.query(
        `SELECT * FROM fornecedores WHERE id = '${idFornecedor}'`,
      )
    ).rows[0];

    const fornecedorAtualizado = (
      await client.query(
        `UPDATE fornecedores SET nome = $1, contato = $2, email = $3, telefone = $4, notas = $5, data_atualizacao = NOW() WHERE id = '${idFornecedor}' RETURNING *`,
        [
          nome || fornecedor.nome,
          contato || fornecedor.contato,
          email || fornecedor.email,
          telefone || fornecedor.telefone,
          notas || fornecedor.notas,
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
  const { id: idFornecedor } = await context.params;
  try {
    const client = await pool.connect();

    const fornecedorRemovido = (
      await client.query(
        `DELETE FROM fornecedores WHERE id = '${idFornecedor}' RETURNING *`)
    ).rows[0];

    client.release();

    return NextResponse.json(fornecedorRemovido);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}
