import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";
import bcrypt from "bcryptjs";

/*
  PUT - Atualizar usuário
*/
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id: idUsuario } = await context.params;
    const body = await request.json();

    const { email, nome, senha, esta_ativo, operacao } = body;

    let usuarioAtualizado;

    if (operacao === "alterar_status") {
      const [result] = await sql`
        UPDATE usuarios
        SET esta_ativo = ${esta_ativo}, data_atualizacao = NOW()
        WHERE id = ${idUsuario}
        RETURNING id, email, nome, esta_ativo
      `;

      usuarioAtualizado = result;
    } else {
      let senhaHash = senha;

      // só faz hash se veio senha nova
      if (senha) {
        senhaHash = await bcrypt.hash(senha, 12);
      }

      const [result] = await sql`
        UPDATE usuarios
        SET 
          email = ${email},
          nome = ${nome},
          senha = ${senhaHash},
          data_atualizacao = NOW()
        WHERE id = ${idUsuario}
        RETURNING id, email, nome, esta_ativo
      `;

      usuarioAtualizado = result;
    }

    return NextResponse.json(usuarioAtualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}

/*
  DELETE - Remover usuário
*/
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id: idUsuario } = await context.params;

    const [usuarioRemovido] = await sql`
      DELETE FROM usuarios
      WHERE id = ${idUsuario}
      RETURNING id, email
    `;

    return NextResponse.json(usuarioRemovido);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}