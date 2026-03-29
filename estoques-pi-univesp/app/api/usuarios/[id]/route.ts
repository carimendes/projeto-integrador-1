import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

/*
  Função que define a rota da API que irá responder a chamadas para atualizar usuários.
  O verbo utilizado é o PUT, e a rota será {urlHospedagem}/api/usuarios/{idDoUsuario}
  Os dados do usuário que serão atualizados são passados para a API no body da request
*/
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idUsuario } = await context.params;
    const body = await request.json();
    const { email, nome, senha } = body;

    const client = await pool.connect();

    const { rows } = await client.query(
      `UPDATE usuarios SET email = $1, nome = $2, senha = $3, data_atualizacao = NOW() WHERE id = $4 RETURNING *`,
      [email, nome, senha, idUsuario],
    );
    client.release();
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}

/*
  Função que define a rota da API que irá responder a chamadas para remover usuários.
  O verbo utilizado é o DELETE, e a rota será {urlHospedagem}/api/usuarios/{idDoUsuario}
*/
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idUsuario } = await context.params;
  try {
    const client = await pool.connect();

    const usuarioRemovido = (
      await client.query(
        `DELETE FROM usuarios WHERE id = '${idUsuario}' RETURNING *`,
      )
    ).rows[0];

    client.release();

    return NextResponse.json(usuarioRemovido);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}