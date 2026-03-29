import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

/*
  Função que define a rota da API que irá responder a chamadas para atualizar fornecedores.
  O verbo utilizado é o PUT, e a rota será {urlHospedagem}/api/fornecedores/{idDoFornecedor}
  Os dados do fornecedor que serão atualizados são passados para a API no body da request
*/
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

/*
  Função que define a rota da API que irá responder a chamadas para remover fornecedores.
  O verbo utilizado é o DELETE, e a rota será {urlHospedagem}/api/fornecedores/{idDoFornecedor}
*/
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
