import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";

/*
  PUT - Atualizar fornecedor
*/
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: idFornecedor } = await context.params;

  try {
    const body = await request.json();

    const { nome, contato, email, telefone, notas } = body;

    const [fornecedorAtualizado] = await sql`
      UPDATE fornecedores
      SET
        nome = COALESCE(${nome}, nome),
        contato = COALESCE(${contato}, contato),
        email = COALESCE(${email}, email),
        telefone = COALESCE(${telefone}, telefone),
        notas = COALESCE(${notas}, notas),
        data_atualizacao = NOW()
      WHERE id = ${idFornecedor}
      RETURNING *
    `;

    if (!fornecedorAtualizado) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(fornecedorAtualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}

/*
  DELETE - Remover fornecedor
*/
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: idFornecedor } = await context.params;

  try {
    const [fornecedorRemovido] = await sql`
      DELETE FROM fornecedores
      WHERE id = ${idFornecedor}
      RETURNING *
    `;

    if (!fornecedorRemovido) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(fornecedorRemovido);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}